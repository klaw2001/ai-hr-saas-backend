import { Response } from "express";

export function sendResponse(res: Response, status: boolean, data: any, message: string, statusCode: number = 200, apiVersion: String = '') {
    let obj = {
        status,
        data,
        message,
        apiVersion: apiVersion || 'No Version',
    };

     res.status(statusCode).json(obj);
     return;
};
