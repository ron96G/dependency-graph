import { createStore } from 'vuex'
import type { IGraphData } from './components/importer/types'

export interface State {
  graph: any | undefined,
  data: IGraphData | undefined
  loading: boolean
}

export const store = createStore<State>({
  state() {
    return {
      graph: undefined,
      data: undefined,
      loading: false
    }
  },
  mutations: {
    updateGraph(state: State, graph: any) {
      console.log(`updated graph`)
      state.graph = graph
    },
    updateGraphData(state: State, data: IGraphData) {
      console.log(`updated graph data`)
      state.data = data
    },
    updateLoading(state: State, currentlyLoading: boolean) {
      state.loading = currentlyLoading
    }
  },
  getters: {
    getGraph(state: State) {
      return state.graph
    },
    getGraphData(state: State) {
      // copy
      return JSON.parse(JSON.stringify({
        nodes: state.data?.nodes,
        edges: state.data?.edges,
        combos: state.data?.combos,
      }))
    },
    isLoading(state: State) {
      return state.loading
    }
  }
})