import { Model, Table, Column, DataType } from "sequelize-typescript";

@Table({
    tableName: Products.VAR_TABLE_NAME
})
export class Products extends Model {
    public static VAR_TABLE_NAME = "products" as string;
    public static VAR_ID = "id" as string;
    public static VAR_NAME = "name" as string;

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        field: Products.VAR_ID,
        autoIncrement: true
    })
    id!: number;

    @Column({
        type: DataType.STRING(100),
        field: Products.VAR_NAME,
        unique: true,
        allowNull: false
    })
    name!: string;

}
