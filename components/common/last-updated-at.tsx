import {CalendarAdd, UpdateNow, User} from "@carbon/icons-react"

interface PageDatesProps {
    publishedAt: string
    updatedAt: string
    author?: string
}

export default function PageDates({publishedAt, updatedAt, author}: PageDatesProps) {
    return (<div style={{display: 'table', marginTop: '1rem'}}>
        <div style={{display: 'table-row'}}>
            <div style={{display: 'table-cell', verticalAlign: 'top', paddingRight: '0.5rem'}}>
                <CalendarAdd size={12}/>
            </div>
            <div style={{display: 'table-cell', verticalAlign: 'top'}}>
                <p style={{fontFamily: "IBM Plex Mono", fontSize: '0.8rem', fontWeight: 'normal', margin: 0}}>
                    Published Date：{publishedAt}
                </p>
            </div>
        </div>
        <div style={{display: 'table-row'}}>
            <div style={{display: 'table-cell', verticalAlign: 'top', paddingRight: '0.5rem'}}>
                <UpdateNow size={12}/>
            </div>
            <div style={{display: 'table-cell', verticalAlign: 'top'}}>
                <p style={{
                    fontFamily: "IBM Plex Mono",
                    fontSize: '0.8rem',
                    fontWeight: 'normal',
                    margin: 0,
                    marginBottom: author ? 0 : '1rem'
                }}>
                    Last Updated Date：{updatedAt}
                </p>
            </div>
        </div>
        {author && (<div style={{display: 'table-row'}}>
            <div style={{display: 'table-cell', verticalAlign: 'top', paddingRight: '0.5rem'}}>
                <User size={12}/>
            </div>
            <div style={{display: 'table-cell', verticalAlign: 'top'}}>
                <p style={{
                    fontFamily: "IBM Plex Mono",
                    fontSize: '0.8rem',
                    fontWeight: 'normal',
                    margin: 0,
                    marginBottom: '1rem'
                }}>
                    Author：{author}
                </p>
            </div>
        </div>)}
    </div>)
}