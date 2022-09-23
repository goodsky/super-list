import { useEffect, useReducer, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Stack } from '@mui/material'
import dayjs from 'dayjs'

import ModifyList from './ModifyList'
import ModifyListItem from './ModifyListItem'
import PopUp from '../components/PopUp'

import groceryService from '../services/groceries'
import listService from '../services/lists'
import listItemService from '../services/listItems'
import storeService from '../services/stores'

const initialState = {
    list: {
        name: 'Shopping List',
        shoppingDate: dayjs(),
        items: [],
        stores: [],
        isChanged: false, // client only field
    },
    mode: 'list',
    itemIndex: null,
    storeIndex: 0,
    groceries: [],
    stores: [],
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'updateName':
            const nameChanged = state.list.name !== action.name
            return {
                ...state,
                list: { ...state.list, name: action.name, isChanged: state.list.isChanged || nameChanged },
            }

        case 'updateShoppingDate':
            const shoppingDateChanged = state.list.shoppingDate !== action.shoppingDate
            console.log('New Shopping Date', action.shoppingDate, shoppingDateChanged)
            return {
                ...state,
                list: {
                    ...state.list,
                    shoppingDate: action.shoppingDate,
                    isChanged: state.list.isChanged || shoppingDateChanged,
                },
            }

        case 'resetIsChanged':
            return { ...state, list: { ...state.list, isChanged: false } }

        case 'addStore':
            const updatedStores = state.list.stores.concat(action.store)
            return { ...state, list: { ...state.list, stores: updatedStores }, storeIndex: updatedStores.length - 1 }

        case 'addItem':
            const itemsWithAdded = state.list.items.concat(action.item)
            return { ...state, mode: 'list', list: { ...state.list, items: itemsWithAdded } }

        case 'updateItem':
            const itemsWithUpdated = state.list.items.map((item) => (item.id === action.item.id ? action.item : item))
            return { ...state, mode: 'list', list: { ...state.list, items: itemsWithUpdated } }

        case 'setStoreIndex':
            return { ...state, storeIndex: action.index }

        case 'setMode':
            return { ...state, mode: action.mode, itemIndex: action.itemIndex }

        case 'setList':
            return { ...state, list: { ...action.list, isChanged: false } }

        case 'setGroceries':
            return { ...state, groceries: action.groceries }

        case 'setStores':
            return { ...state, stores: action.stores }

        default:
            throw new Error(`Unknown action type ${action.type} in ModifyList`)
    }
}

const ModifyListIndex = ({ isEdit }) => {
    const [state, dispatch] = useReducer(reducer, initialState)

    const popup = useRef()
    const { id } = useParams()
    const idInt = parseInt(id, 10)

    if (isEdit) {
        if (!id) {
            console.error('Missing id while modifying a store!')
        } else if (!idInt) {
            console.error('Invalid id while modifying a store!')
        }
    }

    useEffect(() => {
        const fetchOrCreateList = async () => {
            if (isEdit) {
                const listPromise = listService.getListById(id)
                const itemPromise = listItemService.getItemsByListId(id)
                const [listResult, itemResult] = await Promise.all([listPromise, itemPromise])
                if (listResult.success && itemResult.success) {
                    const list = {
                        id: listResult.list.id,
                        name: listResult.list.name,
                        shoppingDate: dayjs(listResult.list.shoppingDate),
                        items: itemResult.items,
                        stores: [], // TODO: The backend needs to be updated to support my new store format
                    }
                    console.log('Fetched list', list)
                    dispatch({ type: 'setList', list })
                } else {
                    console.error('Failed to fetch list', listResult, itemResult)
                }
            } else {
                const result = await listService.addList({
                    name: state.list.name,
                    shoppingDate: state.list.shoppingDate.format('YYYY-MM-DD'),
                })
                if (result.success) {
                    console.log('Added list', result.list)
                    dispatch({ type: 'setList', list: result.list })
                } else {
                    console.error('Failed to initialize list', result)
                }
            }
        }

        const fetchGroceries = async () => {
            const result = await groceryService.getGroceries()
            if (result.success) {
                // The list item autocomplete expects groceries to be sorted by section
                const sortedGroceries = result.groceries
                    .map((grocery) => (grocery.section ? grocery : { ...grocery, section: 'Unknown' }))
                    .sort((a, b) => ('' + a.section).localeCompare(b.section))

                console.log('loaded groceries', sortedGroceries)
                dispatch({ type: 'setGroceries', groceries: sortedGroceries })
            } else {
                console.error('Failed to load groceries')
            }
        }

        const fetchStores = async () => {
            const result = await storeService.getStores()
            if (result.success) {
                const sortedStores = result.stores.sort((a, b) => ('' + a.name).localeCompare(b.name))

                console.log('loaded stores', sortedStores)
                dispatch({ type: 'setStores', stores: sortedStores })
            } else {
                console.error('Failed to load stores')
            }
        }

        fetchOrCreateList()
        fetchGroceries()
        fetchStores()
        // I want this to happen once... but I may be making a mistake by removing this warning
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getPageContent = () => {
        switch (state.mode) {
            case 'list':
                return (
                    <ModifyList
                        dispatch={dispatch}
                        isEdit={isEdit}
                        list={state.list}
                        storeIndex={state.storeIndex}
                        stores={state.stores}
                    />
                )

            case 'item':
                const isEditItem = Number.isInteger(state.itemIndex)
                const item = state.list.items[state.itemIndex]

                if (isEditItem && !item) {
                    console.error('Attempting to modify unknown aisle index', state.aisleIndex)
                    dispatch({ type: 'error', message: 'Ooops! Something bad happened.' })
                    return null
                }

                const store = state.list.stores[state.storeIndex]

                return (
                    <ModifyListItem
                        dispatch={dispatch}
                        isEdit={isEditItem}
                        list={state.list}
                        item={item}
                        groceries={state.groceries}
                        store={store}
                    />
                )

            default:
                console.error('Unknown page mode', state.mode)
        }
    }

    return (
        <Container maxWidth="sm">
            <Stack>
                <PopUp ref={popup} />
                {getPageContent()}
            </Stack>
        </Container>
    )
}

export default ModifyListIndex
