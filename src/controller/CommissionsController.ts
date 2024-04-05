import { Request , Response } from "express";
import { CommissionsRepo } from "../repository/CommissionsRepo";
import { CommissionsService } from "../service/Commissions";

export class CommissionsController{
    async register(req: Request, res: Response){
        try{
            const { title, percentage } = req.body
            await new CommissionsService().register(title, percentage)
            return res.status(200).json({
                status : "success",
                message : "sucessfully registered commission"
            })
        }catch(error){
            console.error("Registration error:", error);
            return res.status(500).json({
                status: "Internal Server Error",
                message: "Something went wrong with register",
              });
        }
    }

    async getCommissions(req : Request, res: Response){
        try{
            const commissions = await new CommissionsRepo().getAll();
            return res.status(200).json({
                status: "Success",
                message: "Successfully fetched commissions",
                commissions: commissions
              });
        }catch (error) {
            console.error("Get commissions error:", error);
            return res.status(500).json({
              status: "Internal Server Error",
              message: "Something went wrong with getCommissions",
            });
          }
    }

    async getComission(req: Request, res: Response){
        const { commissionId } = req.params
        try{
            const commission = await new CommissionsRepo().getById(parseInt(commissionId))
            if (!commission) {
              return res.status(404).json({
                status: "Not found",
                message: "Commission not found",
              });
            }
            return res.status(200).json({
                status: "Success",
                message: "Successfully fetched commission",
                commission: commission
              });
        }catch (error) {
            console.error("Get commission error:", error);
            return res.status(500).json({
              status: "Internal Server Error",
              message: "Something went wrong with getCommission",
            });
          }
    }

    async deleteCommission(req: Request, res: Response){
      const { commissionId } = req.params
      try{
        await new CommissionsRepo().delete(parseInt(commissionId))
        return res.status(200).json({
          status: "Success",
          message: "Successfully deleted commission",
        });
      }catch (error) {
        console.error("Delete commission error:", error);
        return res.status(500).json({
          status: "Internal Server Error",
          message: "Something went wrong with deleteCommission",
        });
    }
      }

}

export default new CommissionsController()