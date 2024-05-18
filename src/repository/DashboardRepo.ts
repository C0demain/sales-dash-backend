import { Op, WhereOptions } from "sequelize";
import NotFoundError from "../exceptions/NotFound";
import { Sells } from "../models/Sells";
import { ClientRepo } from "./ClientRepo";
import { ProductsRepo } from "./ProductsRepo";
import { UsersRepo } from "./UsersRepo";

interface IDashboardRepo {
}

interface MonthSaleStats {
    month: string
    year: number
    totalValue: number
    totalSales: number
}

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export class DashboardRepo implements IDashboardRepo {
    async getStatsFromDate(filters: WhereOptions) {
        try {
            const stats: MonthSaleStats[] = []
            const sales = await Sells.findAll({ where: filters })
            for (let s of sales) {
                let date = new Date(s.date)
                let oldSale = stats.find(sale => sale.month == meses[date.getMonth()] && sale.year == date.getFullYear())
                if (stats.length === 0 || !oldSale) {
                    let newSale: MonthSaleStats = {
                        month: meses[date.getMonth()],
                        year: date.getFullYear(),
                        totalSales: 1,
                        totalValue: s.value
                    }
                    stats.push(newSale)
                } else {
                    oldSale.totalValue += s.value
                    oldSale.totalSales += 1
                }

            }

            return stats

        } catch (error) {
            console.log(error)
            throw new Error("Failed to fetch data!");
        }
    }

    async getUserStats(id: number, filters: WhereOptions) {
        try {
            const user = await new UsersRepo().getById(id);

            if (!user) {
                console.log("User not found");
                throw new NotFoundError(`User with id '${id}' not found`);
            }

            const userName = user.name
            const allSales = await Sells.findAll({ where: filters })
            const salesInfo = await this.salesInfo(filters);

            const soldUser = await Promise.all(allSales.map(async (sale) => {
                const client = await new ClientRepo().getById(sale.clientId);
                return { clientId: sale.clientId, clientName: client.name, productId: sale.productId };
            }));

            const occurrencesClients: { [key: string]: number } = {};
            soldUser.forEach((buyer: { clientId: number; clientName: string; }) => {
                const key = `${buyer.clientName}`;
                occurrencesClients[key] = (occurrencesClients[key] || 0) + 1;
            });

            const occurrencesProducts: { [key: string]: number } = {};
            soldUser.forEach((buyer: { productId: any }) => {
                const key = `${buyer.productId}`;
                occurrencesProducts[key] = (occurrencesProducts[key] || 0) + 1;
            });

            return { userId: id, name: userName, ...(salesInfo), salesPerClient: occurrencesClients, productsSold: occurrencesProducts, sales: soldUser };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            } else {
                throw new Error('Failed to get user stats');
            }
        }
    }

    async getProductStats(id: number, filters: WhereOptions) {
        try {
            const product = await new ProductsRepo().getById(id)

            if (!product) {
                throw new NotFoundError(`User with id '${id}' not found`);
            }

            const allSales = await Sells.findAll({ where: filters })
            const salesInfo = await this.salesInfo(filters);
            const productPurchases = await Promise.all(allSales.map(
                async sale => {
                    const user = await new UsersRepo().getById(sale.userId)
                    const client = await new ClientRepo().getById(sale.clientId)
                    return { clientId: client.id, clientName: client.name, userId: user.id, userName: user.name }
                }
            ))

            // Retorna o numero de vezes que um cliente comprou com o usuário
            const occurrencesClient: { [key: string]: number } = {};
            productPurchases.forEach((buyer: { clientId: number; clientName: string; }) => {
                const key = `${buyer.clientName}`;
                occurrencesClient[key] = (occurrencesClient[key] || 0) + 1;
            });

            const occurrencesUser: { [key: string]: number } = {};
            productPurchases.forEach((buyer: { userName: string; }) => {
                const key = `${buyer.userName}`;
                occurrencesUser[key] = (occurrencesUser[key] || 0) + 1;
            });

            return { productId: id, productName: product.name, ...salesInfo, purchasesPerClient: occurrencesClient, soldPerUser: occurrencesUser, sales: productPurchases }
        } catch (error) {
            throw new Error("Failed to get product stats")
        }
    }

    // Fazer filtragem por categoria
    async getClientStats(id: number, filters: WhereOptions) {
        try {
            const client = await new ClientRepo().getById(id)
            const clientName = client.name

            if (!client) throw new NotFoundError(`Client with id '${client}' not found`);

            const allSales = await Sells.findAll({ where: filters })
            const salesInfo = await this.salesInfo(filters);
            const clientPurchases = await Promise.all(allSales.map(
                async sale => {
                    const user = await new UsersRepo().getById(sale.userId)
                    const product = await new ProductsRepo().getById(sale.productId)
                    return ({ productId: sale.productId, productName: product.name, sellerId: sale.userId, sellerName: user.name })
                }
            ))

            // Retorna o numero de vezes que um cliente comprou com o usuário
            const occurrencesProducts: { [key: string]: number } = {};
            clientPurchases.forEach((buyer: { productId: any }) => {
                const key = `${buyer.productId}`;
                occurrencesProducts[key] = (occurrencesProducts[key] || 0) + 1;
            });

            const occurrencesUsers: { [key: string]: number } = {};
            clientPurchases.forEach((buyer: { sellerName: any }) => {
                const key = `${buyer.sellerName}`;
                occurrencesUsers[key] = (occurrencesUsers[key] || 0) + 1;
            });

            return { clientId: client, clientName: clientName, ...salesInfo, productsPurchased: occurrencesProducts, purchasedWith: occurrencesUsers, sales: clientPurchases }
        } catch (error) {
            if (error instanceof NotFoundError) throw error
            else throw new Error("Failed to get client stats")
        }
    }

    async sortTotalValue(startDate: Date, endDate: Date) {
        try {
            const usersList = await new UsersRepo().getAllSellers()

            let idList: number[] = []
            usersList.forEach(element => idList.push(element.id))
            let valueList: { name: string, id: number, value: number, productsSold: number, totalCommissions: number }[] = []
            for (let x of idList) {
                let user = await new UsersRepo().getById(x)
                let userName = user.name
                const filters = { userId: x, date: { [Op.between]: [startDate, endDate] } }

                let [totalValue, totalCommissions, productsSold] = [
                    await Sells.sum('value', { where: filters }) || 0,
                    await Sells.sum('commissionValue', { where: filters }) || 0,
                    await Sells.count({ where: filters }) || 0
                ]

                valueList.push({ name: userName, id: x, value: totalValue, productsSold: productsSold, totalCommissions: totalCommissions })
            }

            return valueList.sort((a, b) => a.value - b.value).reverse()
        } catch (error) {
            throw new Error(``)
        }
    }

    salesInfo = async (filters: WhereOptions) => {
        let [totalValue, totalCommissions, totalSales] = await Promise.all([
            await Sells.sum('value', { where: filters }) || 0,
            await Sells.sum('commissionValue', { where: filters }) || 0,
            await Sells.count({ where: filters }) || 0,
        ])
        return { totalValue, totalCommissions, totalSales }
    }
}