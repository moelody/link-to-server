import { App, PluginSettingTab, Setting, debounce } from "obsidian"
import LinkOB from "./main"

// Remember to rename these classes and interfaces!

export interface LinkOBSettings {
    port: number
}

export const DEFAULT_SETTINGS: LinkOBSettings = {
    port: 3333
}

export class LinkOBSettingsTab extends PluginSettingTab {
    plugin: LinkOB
    settings: LinkOB["settings"]
    setupProxy: LinkOB["setupProxy"]
    setupPort: LinkOB["setupPort"]

    constructor(app: App, plugin: LinkOB) {
        super(app, plugin)
        this.plugin = plugin
        this.settings = plugin.settings
        this.setupProxy = plugin.setupProxy
        this.setupPort = plugin.setupPort
    }

    display(): void {
        let { containerEl } = this

        const isVaildPort = (str: string) => {
            const test = /^()([1-9]|[1-5]?[0-9]{2,4}|6[1-4][0-9]{3}|65[1-4][0-9]{2}|655[1-2][0-9]|6553[1-5])$/
            return test.test(str)
        }

        containerEl.empty()

        containerEl.createEl("h2", { text: "Link Server" })

        new Setting(containerEl)
            .setName("代理端口号")
            .setDesc("若与现有端口冲突请手动指定其他端口")
            .addText(text => {
                const save = debounce(
                    async (value: string) => {
                        const newPort = await this.setupPort(+value)
                        if (newPort !== +value) text.setValue(newPort.toString())
                        this.setupProxy(newPort)
                    },
                    500,
                    true
                )
                text.setValue(this.settings.port.toString()).onChange(async (value: string) => {
                    text.inputEl.toggleClass("incorrect", !isVaildPort(value))
                    if (isVaildPort(value) && this.settings.port !== +value) save(value)
                })
            })

        const coffeeDiv = containerEl.createDiv("coffee")
        coffeeDiv.addClass("oz-coffee-div")
        const coffeeLink = coffeeDiv.createEl("a", { href: "https://afdian.net/@moelody" })
        const coffeeImg = coffeeLink.createEl("img", {
            attr: {
                src: "https://cdn.jsdelivr.net/gh/moelody/cdn@imgbot/blog/wechatpay.png"
            }
        })
        coffeeImg.height = 150

    }
}
