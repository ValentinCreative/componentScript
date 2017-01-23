import fs from 'fs-extra'
import path from 'path'
import prompt from 'prompt'
import chalk from 'chalk'
import changeCase from 'change-case'
import handlebars from 'handlebars'

const templatesPath = `${__dirname}/templates`
const jsPath        = `${__dirname}/js`

const tab        = '\u0020\u0020\u0020\u0020'
const backTab1   = '\n' + tab
const backTab2   = backTab1 + tab
const backTab3   = backTab2 + tab

class CreateComponent {

    constructor() {
        this.component = {}
        this.type      = {
            name     : 'component',
            prefix   : '',
            folder   : 'components',
            template : `${templatesPath}/component`,
        }
        this.questions = [
            {
                name        : 'type',
                description : 'Your component type (1: Component, 2: StyleGuide, 3: Ui)',
                type        : 'number',
                message     : 'Must be a number between 1 and 3',
                required    : false,
                default     : 1,
            },
            {
                name        : 'name',
                description : 'Your component name (PascalCase)',
                type        : 'string',
                pattern     : /([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*/,
                message     : 'Must be PascalCase',
                required    : true,
            },
        ]
        this.prompt()
    }

    prompt() {
        prompt.start()
        prompt.get(this.questions, (error, result) => {
            this.error(error)
            this.setType(result.type)

            const name = changeCase.pascalCase(result.name)

            this.setComponent(name)
            if (this.component.type == 'styleguide') {
                this.setOriginal(name)
                this.importSgComponent(name)
            } else {
                this.createComponent()
            }
        })
    }

    setType(type) {
        switch (type) {
          case 2:
            this.type.name     = 'styleguide'
            this.type.folder   = 'styleguide'
            this.type.prefix   = 'SgComponent'
            this.type.template = `${templatesPath}/sg-component`
            break
          case 3:
            this.type.name     = 'ui'
            this.type.folder   = 'Ui'
            this.type.prefix   = 'Ui'
            this.type.template = `${templatesPath}/component`
            break
        }
    }

    setComponent(name) {
        this.component = {
            name : {
                pascalCase : this.type.prefix + name,
                paramCase  : changeCase.paramCase(this.type.prefix + name),
            },
            path  : `${jsPath}/${this.type.folder}/${this.type.prefix}${name}/`,
            files : [],
            type  : this.type.name,
        }
    }

    setOriginal(name) {
        let needImport     = true
        let originalFolder = 'components'

        if (name.startsWith('Ui')) {
            needImport     = false
            originalFolder = 'Ui'
        }

        const relativePath = path.relative(`${jsPath}/${this.type.folder}/${this.type.prefix}${name}/`, `${jsPath}/${originalFolder}/${name}/`)

        this.component = {
            ...this.component,
            original : {
                needImport,
                name : {
                    pascalCase : name,
                    paramCase  : changeCase.paramCase(name),
                },
                path     : `${jsPath}/${originalFolder}/${name}/`,
                relative : relativePath,
                files    : [],
            },
        }

        this.getOriginalComponentFiles()
    }

    createComponent() {
        fs.copy(this.type.template, this.component.path, error => {
            this.error(error)
            this.success(`Created dir : ${this.component.path}`)
            this.renameFiles()
        })
    }

    getOriginalComponentFiles() {
        const original = this.component.original

        fs.readdir(original.path, (error, files) => {
            this.error(error)

            files.forEach(file => {
                if (file !== '.DS_Store') {
                    original.files.push(file)
                }
            })

            this.createComponent()
        })
    }

    renameFiles() {
        fs.readdir(this.component.path, (error, files) => {
            files.forEach((file, index) => {
                if (file !== '.DS_Store') {
                    this.error(error)
                    const ext          = path.extname(file)
                    const templateName = path.basename(file, ext)
                    const oldFile      = this.component.path + file
                    const newFile      = this.component.path + this.component.name.pascalCase + ext

                    fs.rename(oldFile, newFile, error => {
                        this.error(error)
                        this.success(`Created file : ${this.component.name.pascalCase + ext}`)

                        this.component.files.push(newFile)
                        if (index == files.length - 1) {
                            this.renderTemplates()
                        }
                    })
                }
            })
        })
    }

    cleanFolder() {
        const DS_Store = `${this.component.path}.DS_Store`
        fs.stat(DS_Store, (error, stat) => {
            if (error === null) {
                fs.unlink(`${this.component.path}.DS_Store`, error => this.error(error))
            } else {
                this.error(error)
            }
        })
    }

    renderTemplates() {
        this.component.files.forEach(file => {
            fs.readFile(file, (error, data) => {
                this.error(error)

                const source       = data.toString()
                const template     = handlebars.compile(source)
                const outputString = template({
                    component : this.component
                })
                fs.writeFile(file, outputString, error => {
                    this.error(error)
                })
            })
        })
    }

    importSgComponent(name) {
        const sgComponentsVue = `${jsPath}/styleguide/SgUiComponents/SgUiComponents.vue`

        const relativePath = path.relative(
            `${jsPath}/styleguide/SgUiComponents/`,
            `${jsPath}/${this.type.folder}/${this.type.prefix}${name}/${this.type.prefix}${name}/`
            )

        const paramCase  = this.component.original.name.paramCase
        const pascalCase = this.component.original.name.pascalCase

        const find = {
            menu      : '<!-- SG-COMPONENT : menu -->',
            display   : '<!-- SG-COMPONENT : display -->',
            import    : '// SG-COMPONENT : import',
            component : '// SG-COMPONENT : component',
        }

        const newString = {
            menu      : `<ui-components-menu-item name="${paramCase}" title="${pascalCase}" />`,
            display   : `<component-${paramCase} v-if="activeComponent === '${paramCase}'" />`,
            import    : `import Component${pascalCase} from '${relativePath}'`,
            component : `Component${pascalCase},`,
        }

        fs.readFile(sgComponentsVue, (error, data) => {
            this.error(error)

            const source = data.toString()

            const outputString = source
                .replace(find.menu, newString.menu + backTab3 + find.menu)
                .replace(find.display, newString.display + backTab2 + find.display)
                .replace(find.import, newString.import + backTab1 + find.import)
                .replace(find.component, newString.component + backTab3 + find.component)

            this.editFile(sgComponentsVue, outputString)
        })
    }

    error(message) {
        if(message) return console.log(chalk.red(message))
    }

    success(message) {
        console.log(chalk.green(message))
    }

    editFile(file, newString) {
        fs.writeFile(file, newString, error => this.error(error))
    }

}

new CreateComponent()