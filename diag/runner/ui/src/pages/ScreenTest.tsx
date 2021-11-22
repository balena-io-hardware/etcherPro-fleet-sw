import { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import './ScreenTest.css';

export const ScreenTest = ({ tiles }: any ) => {
    const location = useLocation()
    let rowsCount = 3;

    if (tiles) {      
      rowsCount = tiles;
    } else if (location.search.indexOf('rows') > -1) {
      const query = new URLSearchParams(location.search)
      rowsCount = parseInt(query.get('rows') as string)
    }

    const toggleBg = (e: EventTarget) => {
      if ((e as HTMLDivElement).style.backgroundColor === 'green' ) {
        (e as HTMLDivElement).style.backgroundColor = 'transparent'
      } else {
        (e as HTMLDivElement).style.backgroundColor = 'green'
      }
    }

    let cols: ReactElement[] = [];  
    let rows: ReactElement[][] = [];  
    let col = (key: number):ReactElement => <div key={key} className="screen-test-cell" onClick={(e) => toggleBg(e.target)}></div>    

    for (let i=0; i<rowsCount; ++i) {
      cols.push(col(i))
    }
    
    
    for (let i=0; i<rowsCount; ++i) {
      rows.push(cols)
    }

    return (
      <>
        {rows.map((row, i) => 
           <div className="screen-test-row" key={i}> {row.map((col) => col )} </div>
        )}
      </>
    );
  };