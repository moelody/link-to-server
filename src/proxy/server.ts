import * as express from "express";
import { NextFunction, Request, Response } from "express";
import { Plugin } from "obsidian";

const getServer = (port: number) => {
    const app = express();

    app.use("/", function(req: Request, res: Response){  
            res.send(Plugin);  
        });
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send(err.message);
    });

    return app.listen(port);
};

export default getServer;