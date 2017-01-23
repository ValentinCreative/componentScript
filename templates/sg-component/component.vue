<template>
    <sg-component title="{{component.original.name.camelCase}}" class="{{component.name.camelCase}}">

        <ui-code title="Documentation"
                 lang="css"
:code='`// Properties
{
    <!-- Properties here -->
}`'
        >
        </ui-code>

        <{{component.original.name.paramCase}}>
        </{{component.original.name.paramCase}}>

        <ui-code title="Code"
                 lang="markup"
:code='`<!-- Checkbox -->
<{{component.original.name.paramCase}}>
</{{component.original.name.paramCase}}>
`'
        >
        </ui-code>

    </sg-component>
</template>

<script>
    import SgComponent from '../SgComponent/SgComponent'
    {{#if component.original.needImport}}
    import {{component.original.name.camelCase}} from '{{component.original.relative}}'
    {{/if}}

    export default {
        name       : '{{component.name.paramCase}}',
        components : {
            SgComponent,
            {{#if component.original.needImport}}
            {{component.original.name.camelCase}},
            {{/if}}
        },
    }
</script>