import { NextFunction, Request, Response } from "express";
import config from "../../config";

export const parseVarificationFiles = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const files = req?.files as {
        certificate?: Express.Multer.File[];
        logo?: Express.Multer.File[];
        pitchDeck?: Express.Multer.File[];
    };

    const certificateFile = files.certificate?.[0];
    const logo = files.logo?.[0];
    const pitchDeckFile = files.pitchDeck?.[0];
    //   certificateUrl     String? // Link to uploaded certificate
    //   pitchDeckUrl       String?
    if (certificateFile) {
        req.body.certificateUrl = `${config.url.backend}/uploads/${certificateFile.filename}`;
    }
    if (logo) {
        req.body.logo = `${config.url.backend}/uploads/${logo.filename}`;
    }
    if (pitchDeckFile) {
        req.body.pitchDeckUrl = `${config.url.backend}/uploads/${pitchDeckFile.filename}`;
    }

    console.log({ certificateFile, logo, pitchDeckFile });

    next();
};
