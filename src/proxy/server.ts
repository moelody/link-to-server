import { default as express } from "express";
import { NextFunction, Request, Response } from "express";
import LinkOB from "../main";

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
    }
}

const getServer = (port: number, plugin: LinkOB) => {
    const app = express();

    app.use("/", async function(req: Request, res: Response){  
        // res.setHeader('Access-Control-Allow-Origin', '*');
        // res.setHeader('Access-Control-Allow-Headers', '*');
        // res.setHeader('Access-Control-Allow-Method', '*');
        const { fileLink, sourcePath } = req.query;
        const file = plugin.app.metadataCache.getFirstLinkpathDest(<string>fileLink, <string>sourcePath);
        if (file) {

            const fileText = await plugin.app.vault.read(file);
    
            const data = {
                basename: file?.basename,
                extension: file?.extension,
                name: file?.name, 
                parent: {
                    name: file?.parent.name,
                    path: file?.parent.path
                },
                path: file?.path,
                vault: {
                    adapter: {
                        basePath: file?.vault.adapter.basePath
                    }
                },
                content: fileText
            }
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