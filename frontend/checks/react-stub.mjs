export const effects=[];
export function useRef(v){return {current:v};}
export function useState(v){return [typeof v==='function'?v():v,()=>{}];}
export function useMemo(fn){return fn();}
export function useCallback(fn){return fn;}
export function useEffect(fn){effects.push(fn);}
export function useLayoutEffect(fn){effects.push(fn);}
export function memo(fn){return fn;}
export function createContext(v){return {Provider:()=>null,_currentValue:v};}
export function useContext(c){return c._currentValue;}
export const Fragment='fragment';
export function createElement(type,props,...children){return {type,props,children};}
export const jsx=(type,props)=>({type,props});export const jsxs=jsx;
export const useId=()=> 'test-id';
