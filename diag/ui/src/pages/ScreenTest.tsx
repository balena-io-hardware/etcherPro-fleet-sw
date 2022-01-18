import { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import './ScreenTest.css';

type ScreenTestPageProps = {
  tiles?: number
}

export const ScreenTest = ({ tiles }: ScreenTestPageProps ) => {
    const location = useLocation()
    let rowsCount = 3;

    const bgColors = ["transparent", "red", "green", "blue", "white", "black"];
    let bgIndex = 0;

    if (tiles) {      
      rowsCount = tiles;
    } else if (location.search.indexOf('rows') > -1) {
      const query = new URLSearchParams(location.search)
      rowsCount = parseInt(query.get('rows') as string)
    }

    const toggleBg = (e: EventTarget) => {
      ++bgIndex;
      (e as HTMLDivElement).style.backgroundColor = bgColors[bgIndex % 6]
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