<template>
    <div class="sg-container sg-components">
        <ui-components-menu>
            <ui-components-menu-item name="icons" title="Icons" />
            <!-- SG-COMPONENT : menu -->
        </ui-components-menu>

        <component-icon v-if="activeComponent === 'icons'" />
        <!-- SG-COMPONENT : display -->
    </div>
</template>

<script>
    import UiComponentsMenu from '../SgUiComponentsMenu/SgUiComponentsMenu'
    import UiComponentsMenuItem from '../SgUiComponentsMenuItem/SgUiComponentsMenuItem'
    import ComponentIcon from '../SgComponentIcon/SgComponentIcon'
    // SG-COMPONENT : import

    export default {
        name       : 'components',
        components : {
            UiComponentsMenu,
            UiComponentsMenuItem,
            ComponentIcon,
            // SG-COMPONENT : component
        },
        computed: {
            activeComponent() {
                return this.$route.params.component
            },
        },
        methods : {
            fixContentScroll() {
                document.querySelector('.main-content').style.overflow = 'visible'
            },
        },
        mounted() {
            this.fixContentScroll()
        },
    }
</script>