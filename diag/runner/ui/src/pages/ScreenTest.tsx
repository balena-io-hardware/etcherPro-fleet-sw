import { ReactElement } from 'react';
import './ScreenTest.css';

export const ScreenTest = ({ tiles }: any ) => {

    let rowsCount = 3;

    if (tiles) {
      console.log(3, tiles);
      
      rowsCount = tiles;
    }    
  
    const setBackground = (e: EventTarget) => {
      (e as HTMLDivElement).style.backgroundColor = 'green'
    }

    let cols: ReactElement[] = [];  
    let rows: ReactElement[][] = [];  
    let col = (key: number):ReactElement => <div key={key} className="screen-test-cell" onClick={(e) => setBackground(e.target)}></div>    

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