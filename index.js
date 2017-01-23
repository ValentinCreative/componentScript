import fs from 'fs-extra'
import path from 'path'
import prompt from 'prompt'
import chalk from 'chalk'
import changeCase from 'change-case'
import handlebars from 'handlebars'

class CreateComponent {

    constructor() {
        this.component = {}
        this.type      = {
            prefix   : '',
            folder   : '',
            template : '',
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
                description : 'Your component name (CamelCase)',
                type        : 'string',
                pattern     : /[A-Z]([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*/,
                message     : 'Must be CamelCase',
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

            this.setComponent(result.name)

            if (this.component.type == 'styleguide') {
                this.setOriginal(result.name)
            } else {
                this.createComponent()
            }
        })
    }

    setType(type) {
        switch (type) {
          case 1:
            this.type.name     = 'component'
            this.type.folder   = 'components'
            this.type.prefix   = ''
            this.type.template = `${__dirname}/templates/component`
            break
          case 2:
            this.type.name     = 'styleguide'
            this.type.folder   = 'styleguide'
            this.type.prefix   = 'SgComponent'
            this.type.template = `${__dirname}/templates/sg-component`
            break
          case 3:
            this.type.name     = 'ui'
            this.type.folder   = 'Ui'
            this.type.prefix   = 'Ui'
            this.type.template = `${__dirname}/templates/component`
            break
          default:
            this.type.name     = 'component'
            this.type.folder   = 'components'
            this.type.prefix   = ''
            this.type.template = `${__dirname}/templates/component`
            break
        }
    }

    setComponent(name) {
        this.component = {
            name : {
                camelCase : this.type.prefix + name,
                paramCase : changeCase.paramCase(this.type.prefix + name),
            },
            path  : `${__dirname}/${this.type.folder}/${this.type.prefix}${name}/`,
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

        const relativePath = path.relative(`${__dirname}/${this.type.folder}/${this.type.prefix}${name}/`, `${__dirname}/${originalFolder}/${name}/`)

        this.component = {
            ...this.component,
            original : {
                needImport,
                name : {
                    camelCase : name,
                    paramCase : changeCase.paramCase(name),
                },
                path     : `${__dirname}/${originalFolder}/${name}/`,
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
                    const newFile      = this.component.path + this.component.name.camelCase + ext

                    fs.rename(oldFile, newFile, error => {
                        this.error(error)
                        this.success(`Created file : ${this.component.name.camelCase + ext}`)

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
                const template     = handlebars.compile(source);
                const outputString = template({
                    component : this.component
                });
                fs.writeFile(file, outputString, error => {
                    this.error(error)
                })
            })
        })
    }

    error(message) {
        if(message) return console.log(chalk.red(message))
    }

    success(message) {
        console.log(chalk.green(message))
    }

}

new CreateComponent()