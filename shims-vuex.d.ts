/* eslint-disable */
declare module '@vue/runtime-core' {
    import { Store } from 'vuex'
    interface ComponentCustomProperties {
        $store: Store<any>
    }
}
