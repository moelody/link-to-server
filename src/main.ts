import getPort from "get-port"
import { Notice, Plugin } from "obsidian"
import { LinkOBSettings, LinkOBSettingsTab, DEFAULT_SETTINGS } from './settings';
import getServer from "./proxy/server"
export default class LinkOB extends Plugin {
    settings: LinkOBSettings = DEFAULT_SETTINGS

    server?: ReturnType<typeof getServer>

    setupProxy = (port: number): void => {
        if (this.server) this.server.close().listen(port)
        else {
            this.server = getServer(port, this)
            this.server.on("error", (err: { message: string | string[] }) => {
                if (err.message.includes("EADDRINUSE")) new Notice("端口已被占用，请在Link Server设置中更改端口号")
                else console.error(err)
            })
        }
    }

    /**
     * detect if port being used, and save free port
     * @param port desire port
     * @returns free port
     */
    setupPort = async (port: number): Promise<number> => {
        const newPort = await getPort({ port })
        if (newPort !== port) {
            new Notice(`${port}端口已被占用，切换至${newPort}`)
        }
        if (this.settings.port !== newPort) {
            this.settings.port = newPort
            await this.saveSettings()
        }
        return newPort
    }

    async onload() {
        console.log("loading LinkOB")

        await this.loadSettings()
        this.addSettingTab(new LinkOBSettingsTab(this.app, this));

        const newPort = await this.setupPort(this.settings.port)
        this.setupProxy(newPort)
    }

    onunload() {
        console.log("unloading LinkOB")

        this.server?.close()
    }

    async loadSettings() {
        this.settings = { ...this.settings, ...(await this.loadData()) }
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }

}