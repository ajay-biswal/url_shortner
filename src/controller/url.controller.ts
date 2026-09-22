import { Request, Response } from "express";

export const createURL = (req:Request, res:Response)=>{
    console.log(req.body);

    return res.status(201).json({
        message:"URL received"
    });
}

