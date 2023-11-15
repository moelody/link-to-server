/*
 * @Author: moelody yfsmallmoon@gmail.com
 * @Date: 2022-01-10 22:10:39
 * @LastEditors: moelody yfsmallmoon@gmail.com
 * @LastEditTime: 2023-11-15 22:01:16
 * @FilePath: \link-info-server\src\proxy\server.ts
 * @Description: 
 * 
 * Copyright (c) 2022 by moelody yfsmallmoon@gmail.com, All Rights Reserved. 
 */
import { default as express } from "express";
import { NextFunction, Request, Response } from "express";
import LinkOB from "../main";
import { FileSystemAdapter } from "obsidian"

type TFile = {
    basename: string,
    extension: string
    name: string, 
    parent: {
        name: string,
        path: string
    },
    path: string,
    vault: {
        adapter: {
            basePath: string
        }
    },
    content: string
}

const getServer = (port: number, plugin: LinkOB) => {
    const app = express();

    app.use("/", async function(req: Request, res: Response){  
        // res.setHeader('Access-Control-Allow-Origin', '*');
        // res.setHeader('Access-Control-Allow-Headers', '*');
        // res.setHeader('Access-Control-Allow-Method', '*');
        const { fileLink, sourcePath } = req.query;
        console.log(`fileLink:${fileLink}`);
        console.log(`sourcePath:${sourcePath}`);
        const file = plugin.app.metadataCache.getFirstLinkpathDest(<string>fileLink, <string>sourcePath);
        console.log(`file:${file}`);
        if (file) {

            const vault = plugin.app.vault;
            const fileText = await vault.cachedRead(file);
    
            const data = {
                basename: file.basename,
                extension: file.extension,
                name: file.name, 
                parent: {
                    name: file.parent.name,
                    path: file.parent.path
                },
                path: file.path,
                vault: {
                    adapter: {
                        basePath: (vault.adapter instanceof FileSystemAdapter) ? vault.adapter.getBasePath() : null
                    }
                }
            }
            console.log(`请求数据${JSON.stringify(data)}`);
            res.send(JSON.stringify(data));
        } else {
            res.send('failed to find');
        }
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send(err.message);
    });

    return app.listen(port);
};

export default getServer;