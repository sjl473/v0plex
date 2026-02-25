"use client"

import React, {createContext, ReactNode, useContext} from 'react';
import {ListItem, Theme, UnorderedList} from '@carbon/react';
import {useTheme} from '@/components/common/theme-provider';


const ListNestingContext = createContext(false);

interface ListProps {
    children: ReactNode;
    className?: string;
}

export function Ulvmd({children, className}: ListProps) {

    const isNested = useContext(ListNestingContext);
    const {theme} = useTheme();


    if (isNested) {
        return (<ListNestingContext.Provider value={true}>
                <UnorderedList
                    nested={true}
                    isExpressive={false}
                    className={className}
                >
                    {children}
                </UnorderedList>
            </ListNestingContext.Provider>);
    }

    return (<ListNestingContext.Provider value={true}>
            <Theme theme={theme}>
                <UnorderedList
                    nested={false}
                    isExpressive={false}
                    className={className}
                >
                    {children}
                </UnorderedList>
            </Theme>
        </ListNestingContext.Provider>);
}

export function Livmd({children, className}: ListProps) {
    return (<ListItem className={className}>
            {children}
        </ListItem>);
}