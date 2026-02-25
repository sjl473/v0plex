"use client"

import React, {createContext, ReactNode, useContext} from 'react';
import {OrderedList, Theme} from '@carbon/react';
import {useTheme} from '@/components/common/theme-provider';

const ListNestingContext = createContext(false);

interface ListProps {
    children: ReactNode;
    className?: string;
}

export function Olvmd({children, className}: ListProps) {
    const isNested = useContext(ListNestingContext);
    const {theme} = useTheme();
    const style = {marginLeft: '1.5rem'};

    if (isNested) {
        return (<ListNestingContext.Provider value={true}>
                <OrderedList
                    nested={true}
                    isExpressive={false}
                    className={className}
                    style={style}
                >
                    {children}
                </OrderedList>
            </ListNestingContext.Provider>);
    }

    return (<ListNestingContext.Provider value={true}>
            <Theme theme={theme}>
                <OrderedList
                    nested={false}
                    isExpressive={false}
                    className={className}
                    style={style}
                >
                    {children}
                </OrderedList>
            </Theme>
        </ListNestingContext.Provider>);
}