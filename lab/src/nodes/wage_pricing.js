// wage_pricing node, task 036. Expansion order and expressions match the reference prototype.
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const finite = x => typeof x === 'number' && Number.isFinite(x);
const fold = x => String(x).toLowerCase();
const sub = (s, c) => s.replaceAll('{C}', c);
const unknown = (o, keys, p, errors) => { if (object(o)) for (const k of Object.keys(o)) if (!keys.includes(k)) errors.push(`${p}.${k}: unknown field`); };
const str = (o, k, p, errors) => { if (!object(o) || !(k in o)) errors.push(`${p}.${k}: required field is missing`); else if (!nonempty(o[k])) errors.push(`${p}.${k}: must be a non-empty string`); };
const coloniesMap = (o, C, p, errors, condition, message) => {
  if (!object(o)) { errors.push(`${p}: must be an object`); return; }
  unknown(o, C, p, errors);
  for (const c of C) {
    if (!(c in o)) errors.push(`${p}.${c}: required field is missing`);
    else if (!finite(o[c]) || !condition(o[c])) errors.push(`${p}.${c}: ${message}`);
  }
};
export function validateWagePricingDeclaration(d, path, errors) {
  const top = ['type','version','colonies','switch','parameters','inputs','prices','demand'];
  unknown(d, top, path, errors);
  for (const k of top) if (!(k in d)) errors.push(`${path}.${k}: required field is missing`);
  if (d.version !== 1) errors.push(`${path}.version: must be 1`);
  str(d, 'switch', path, errors);
  if (!Array.isArray(d.colonies) || d.colonies.length < 2) errors.push(`${path}.colonies: must contain at least two regions`);
  const C = Array.isArray(d.colonies) ? d.colonies.filter(nonempty) : [];
  const seenC = new Set();
  for (const [i,c] of (Array.isArray(d.colonies) ? d.colonies : []).entries()) {
    if (!nonempty(c)) errors.push(`${path}.colonies[${i}]: non-empty string required`);
    else if (seenC.has(fold(c))) errors.push(`${path}.colonies[${i}]: duplicate colony ${c}`);
    else seenC.add(fold(c));
  }
  if (!object(d.parameters) || !Object.keys(d.parameters).length) errors.push(`${path}.parameters: must be a non-empty object`);
  else for (const [k,v] of Object.entries(d.parameters)) if (!nonempty(k) || !finite(v) || !(v > 0)) errors.push(`${path}.parameters.${k}: must be finite and > 0`);
  if (!object(d.inputs)) errors.push(`${path}.inputs: must be an object`);
  else { unknown(d.inputs, ['wage','initial_wage'], `${path}.inputs`, errors); for (const k of ['wage','initial_wage']) str(d.inputs,k,`${path}.inputs`,errors); }
  for (const kind of ['prices','demand']) {
    const items = d[kind];
    if (!Array.isArray(items) || !items.length) { errors.push(`${path}.${kind}: must be non-empty array`); continue; }
    const names = new Set(), targets = new Set();
    for (const [i,item] of items.entries()) {
      const p = `${path}.${kind}[${i}]`;
      if (!object(item)) { errors.push(`${p}: must be an object`); continue; }
      unknown(item, kind === 'prices' ? ['name','target','labor_share'] : ['name','target','price','elasticity','reference_price'], p, errors);
      for (const k of (kind === 'prices' ? ['name','target'] : ['name','target','price','elasticity'])) str(item,k,p,errors);
      for (const [k,set] of [['name',names],['target',targets]]) if (nonempty(item[k])) {
        if (set.has(fold(item[k]))) errors.push(`${p}.${k}: duplicate ${item[k]}`);
        set.add(fold(item[k]));
      }
      if (kind === 'prices') coloniesMap(item.labor_share,C,`${p}.labor_share`,errors,v=>v>=0&&v<=1,'must be in [0,1]');
      else {
        coloniesMap(item.reference_price,C,`${p}.reference_price`,errors,v=>v>0,'must be > 0');
        if (nonempty(item.elasticity) && !Object.hasOwn(d.parameters || {},item.elasticity)) errors.push(`${p}.elasticity: not in parameters`);
      }
    }
  }
}
export function expandWagePricing(d, base) {
  const byName = new Map(base.elements.filter(e=>e.type!=='LINK'&&e.name).map(e=>[e.name,e]));
  const C=d.colonies, SW=d.switch, ON=`[${SW}] = 1`, I=d.inputs;
  const must = n => {const e=byName.get(n);if(!e)throw Error(`wage_pricing: base element missing: ${n}`);return e;};
  const val = n => String(must(n).behavior.value);
  const add=[],rep=[];
  const V=(name,value,note)=>add.push({type:'VARIABLE',name,behavior:{value},description:`Wage pricing node: ${note||name}.`});
  const wrap=(name,fresh)=>{const old=val(name);rep.push({name,value:`IfThenElse(${ON}, ${fresh(`(${old})`)}, ${old})`});};
  if(byName.has(SW))throw Error(`wage_pricing: switch "${SW}" already exists in base`);
  for(const X of C) {
    must(sub(I.wage,X));must(sub(I.initial_wage,X));
    for(const p of d.prices){const e=must(sub(p.target,X));if(e.type!=='VARIABLE'||e.behavior?.value==null)throw Error(`wage_pricing: ${e.name} must be a VARIABLE with formula/value`);}
    for(const q of d.demand){const e=must(sub(q.target,X));if(e.type!=='VARIABLE'||e.behavior?.value==null)throw Error(`wage_pricing: ${e.name} must be a VARIABLE with formula/value`);must(sub(q.price,X));}
  }
  V(SW,0,'switch of wage pricing (0 = every earlier series unchanged)');
  for(const [k,v] of Object.entries(d.parameters))V(k,v,`parameter ${k}`);
  for(const X of C){
    V(`${X} Relative Wage Change`,`[${sub(I.wage,X)}] / Max([${sub(I.initial_wage,X)}], 0.000001) - 1`,'wage relative to its start, minus one');
    for(const p of d.prices){
      const share=`${X} ${p.name} Labor Share`;
      V(share,p.labor_share[X],`share of labor in the start ${p.name.toLowerCase()} price (at most 1)`);
      wrap(sub(p.target,X),o=>`${o} * Max(1 + [${share}] * [${X} Relative Wage Change], 0.000001)`);
    }
    for(const q of d.demand){
      const ref=`${X} ${q.name} Demand Reference Price`, f=`${X} ${q.name} Price Demand Factor`;
      V(ref,q.reference_price[X],`${q.name.toLowerCase()} price at which demand is the norm`);
      V(f,`Max([${sub(q.price,X)}] / [${ref}], 0.000001) ^ (-[${q.elasticity}])`,`${q.name.toLowerCase()} demand response to its price`);
      wrap(sub(q.target,X),o=>`${o} * [${f}]`);
    }
  }
  const names=new Set();
  for(const e of add){
    if(byName.has(e.name)||names.has(fold(e.name))||[...byName.keys()].some(n=>fold(n)===fold(e.name)))throw Error(`wage_pricing: generated name conflicts with base element "${e.name}"`);
    names.add(fold(e.name));
  }
  const added=new Map(add.map(e=>[e.name,e])),resolve=n=>added.get(n)||byName.get(n);
  const have=new Set(base.elements.filter(e=>e.type==='LINK').map(e=>`${e.from}|${e.to}`));
  const links=[],refs=v=>[...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m=>m[1]))];
  for(const [to,v] of [...add.map(e=>[e.name,e.behavior.value]),...rep.map(r=>[r.name,r.value])]){
    for(const r of refs(v)){
      const src=resolve(r);if(!src)throw Error(`wage_pricing: ${to}: unresolved [${r}]`);
      const k=`${src.name}|${to}`;if(!have.has(k)){have.add(k);links.push({from:src.name,to});}
    }
  }
  return {patch:{add_elements:add,replace_formulas:rep,add_links:links},validation:{
    wage_pricing_instances:C.map(X=>({name:`${X} wage pricing`,colony:X,wage:sub(I.wage,X),initial_wage:sub(I.initial_wage,X),relative_wage_change:`${X} Relative Wage Change`,
      prices:d.prices.map(p=>({target:sub(p.target,X),labor_share:`${X} ${p.name} Labor Share`})),
      demand:d.demand.map(q=>({target:sub(q.target,X),price:sub(q.price,X),reference_price:`${X} ${q.name} Demand Reference Price`,factor:`${X} ${q.name} Price Demand Factor`,elasticity:q.elasticity}))})),
    wage_pricing_switch:SW}};
}
