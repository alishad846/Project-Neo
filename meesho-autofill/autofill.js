(function(){
"use strict";

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitFor(fn,timeout=10000,interval=150){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{
      const result=fn();
      if(result)return result;
    }catch(_){}
    await sleep(interval);
  }
  return null;
}

const log=(...a)=>console.log("[MEESHO AUTOFILL]",...a);
const warn=(...a)=>console.warn("[MEESHO AUTOFILL]",...a);
const error=(...a)=>console.error("[MEESHO AUTOFILL]",...a);

function normalizeKey(v){
  return String(v??"").trim().toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]/g,"");
}

function cleanValue(v){
  if(v===undefined||v===null)return null;
  if(typeof v==="string"&&!v.trim())return null;
  return v;
}

function valuesMatch(a,b){
  if(a===undefined||a===null||b===undefined||b===null)return false;
  const x=normalizeKey(a),y=normalizeKey(b);
  return !!x&&!!y&&(x===y||x.includes(y)||y.includes(x));
}

function getReactFiber(el){
  if(!el)return null;
  const key=Object.keys(el).find(k=>k.startsWith("__reactFiber$"));
  return key?el[key]:null;
}

function getReactProps(el,predicate){
  let fiber=getReactFiber(el);
  while(fiber){
    const props=fiber.memoizedProps;
    if(props&&predicate(props,fiber))return{fiber,props};
    fiber=fiber.return;
  }
  return null;
}

function findReactHandler(fiber,name,identifier=null){
  let current=fiber;
  while(current){
    const props=current.memoizedProps;
    if(props&&typeof props[name]==="function"){
      if(!identifier)return{fiber:current,props};
      const attr=props?.attribute?.identifier;
      if(attr&&normalizeKey(attr)===normalizeKey(identifier))return{fiber:current,props};
      if(!props.attribute)return{fiber:current,props};
    }
    current=current.return;
  }
  return null;
}

function getAllInteractiveElements(){
  return[...document.querySelectorAll('input,textarea,button,select,[role="combobox"],[data-testid]')];
}

function getElementIdentifiers(el,props){
  return[
    props?.attribute?.identifier,
    props?.attribute?.name,
    el?.id,
    el?.name,
    el?.getAttribute?.("data-testid"),
    el?.getAttribute?.("aria-label"),
    el?.getAttribute?.("placeholder")
  ].filter(Boolean).map(normalizeKey).filter(Boolean);
}

function collectReactFields(){
  const fields=[];
  for(const element of getAllInteractiveElements()){
    const react=getReactProps(element,props=>!!(props?.attribute?.identifier||props?.attribute?.name));
    if(!react)continue;
    fields.push({
      element,
      fiber:react.fiber,
      props:react.props,
      identifiers:getElementIdentifiers(element,react.props)
    });
  }
  return fields;
}

function findReactField(identifier){
  const wanted=normalizeKey(identifier);
  return collectReactFields().find(f=>f.identifiers.includes(wanted))||null;
}

function getFieldStateValue(field){
  if(!field)return"";
  const values=[
    field.element?.value,
    field.props?.attribute?.value,
    field.props?.value,
    field.props?.inputValue,
    field.element?.getAttribute?.("value")
  ];
  for(const value of values){
    if(value!==undefined&&value!==null&&String(value).trim())return String(value);
  }
  return"";
}

function getCurrentFieldValue(field){
  return getFieldStateValue(field);
}

function getCurrentFieldValueByIdentifier(identifier){
  const wanted=normalizeKey(identifier);

  try{
    const exact=document.querySelectorAll(`#${CSS.escape(identifier)}`);
    for(const element of exact){
      const value=String(element.value??"").trim();
      if(value)return value;
    }
  }catch(_){}

  for(const field of collectReactFields()){
    if(field.identifiers.includes(wanted)){
      const value=getFieldStateValue(field);
      if(value.trim())return value;
    }
  }

  const plain=findPlainField(identifier);
  return plain&&String(plain.value??"").trim()?String(plain.value):"";
}

function findPlainField(identifier){
  try{
    const direct=document.querySelector(`#${CSS.escape(identifier)}`);
    if(direct)return direct;
  }catch(_){}
  const wanted=normalizeKey(identifier);
  return getAllInteractiveElements().find(el=>[
    el.id,
    el.name,
    el.getAttribute?.("data-testid"),
    el.getAttribute?.("aria-label"),
    el.getAttribute?.("placeholder")
  ].filter(Boolean).map(normalizeKey).includes(wanted))||null;
}

function setInputValue(el,value){
  value=cleanValue(value);
  if(value===null||!el)return false;

  const stringValue=String(value);

  try{
    const proto=Object.getPrototypeOf(el);
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;

    if(setter)setter.call(el,stringValue);
    else el.value=stringValue;
  }catch(_){
    el.value=stringValue;
  }

  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
  el.dispatchEvent(new Event("blur",{bubbles:true}));

  return true;
}

const FIELD_ALIASES={
  product_name:["product_name","productName","title","product_title","productTitle","name"],
  product_weight_in_gms:["product_weight_in_gms","productWeightInGms","net_weight","netWeight","weight"],
  supplier_product_id:["supplier_product_id","supplierProductId","style_code","styleCode","style_id","styleId","product_id","productId"],
  supplier_sku_id:["supplier_sku_id","supplierSkuId","sku","sku_id","skuId"],
  color:["color","colour","color_name","colour_name"],
  combo_of:["combo_of","comboOf","combo"],
  fabric:["fabric","material","material_type","materialType"],
  fit_shape:["fit_shape","fitShape","fit"],
  generic_name:["generic_name","genericName","product_type","productType"],
  multipack:["multipack","multi_pack","multiPack","pack_size","packSize"],
  no_of_compartments:["no_of_compartments","no._of_compartments","number_of_compartments","compartments","_of_compartments"],
  length:["length","product_length","productLength"],
  neck:["neck","neck_type","neckType"],
  occasion:["occasion","occasion_type","occasionType"],
  pattern:["pattern","design"],
  print_or_pattern_type:["print_or_pattern_type","print_type","printType","pattern_type","patternType"],
  sleeve_length:["sleeve_length","sleeveLength","sleeve"],
  stitch_type:["stitch_type","stitchType","stitch"],
  country_of_origin:["country_of_origin","countryOfOrigin","origin"],
  brand:["brand","brand_name","brandName"],
  ornamentation:["ornamentation","embellishment"],
  sleeve_styling:["sleeve_styling","sleeveStyling","sleeve_style","sleeveStyle"],
  surface_styling:["surface_styling","surfaceStyling","surface_style","surfaceStyle"],
  manufacturer_details:["manufacturer_details","manufacturerDetails","manufacturer"],
  packer_details:["packer_details","packerDetails","packer"],
  importer_details:["importer_details","importerDetails","importer"],
  description:["description","product_description","productDescription","desc","comment"],
  hsn_code:["hsn_code","hsnCode","hsn","hsn_id"],
  number_of_pockets:["number_of_pockets","numberOfPockets","pockets","pocket_count"],
  stretchability:["stretchability","stretch","stretch_type"],
  weave_pattern:["weave_pattern","weavePattern","weave"],
  closure:["closure","closure_type","closureType"],
  hemline:["hemline","hem_line","hemLine"],
  style:["style","style_type","styleType"],
  quantity:["quantity","net_quantity","netQuantity"],
  size:["size","sizes","variation","variation_name"],
  bust_size:["bust_size","bustSize","bust"],
  chest_size:["chest_size","chestSize","chest","bust_size","bust"],
  shoulder_size:["shoulder_size","shoulderSize","shoulder"],
  waist_size:["waist_size","waistSize","waist"],
  hip_size:["hip_size","hipSize","hip"],
  length_size:["length_size","lengthSize","garment_length","garmentLength","size_length"],
  color_family:["color_family","colorFamily","colour_family","colourFamily"],
  gender:["gender","product_gender","productGender"],
  age_group:["age_group","ageGroup"],
  toy_type:["toy_type","toyType"],
  shoe_type:["shoe_type","shoeType","footwear_type","footwearType"],
  sole_material:["sole_material","soleMaterial"],
  occasion_type:["occasion_type","occasionType"],
  material:["material","material_type","materialType"]
};

function getAliases(key){
  const normalized=normalizeKey(key);

  for(const[canonical,aliases]of Object.entries(FIELD_ALIASES)){
    if(
      normalized===normalizeKey(canonical)||
      aliases.map(normalizeKey).includes(normalized)
    ){
      return[canonical,...aliases];
    }
  }

  return[key];
}

function flattenObject(value,prefix="",out={}){
  if(!value||typeof value!=="object")return out;

  if(Array.isArray(value)){
    value.forEach((item,i)=>{
      if(item&&typeof item==="object"){
        flattenObject(
          item,
          prefix?`${prefix}.${i}`:String(i),
          out
        );
      }
    });
    return out;
  }

  for(const[key,item]of Object.entries(value)){
    const path=prefix?`${prefix}.${key}`:key;

    if(item!==null&&typeof item==="object"){
      flattenObject(item,path,out);
    }else{
      out[path]=item;
    }
  }

  return out;
}

function buildValueIndex(product){
  const index={};
  const source={
    ...(product||{}),
    ...(product?.attributes||{})
  };

  Object.assign(
    source,
    flattenObject(product?.attributes||{})
  );

  for(const[key,value]of Object.entries(source)){
    const normalized=normalizeKey(
      key.split(".").pop()
    );

    if(normalized&&value!==undefined){
      index[normalized]=value;
    }
  }

  return index;
}

function getProductValue(product,keys){
  const index=buildValueIndex(product);

  for(const key of keys){
    for(const alias of getAliases(key)){
      const value=cleanValue(
        index[normalizeKey(alias)]
      );

      if(value!==null)return value;
    }
  }

  return null;
}

function getAttributeValue(product,identifier){
  return getProductValue(
    product,
    [
      identifier,
      ...getAliases(identifier)
    ]
  );
}

const VALUE_ALIASES={
  sleeve_length:{
    "Full Sleeves":"Long Sleeves",
    "Full Sleeve":"Long Sleeves",
    "Long Sleeve":"Long Sleeves"
  },
  sleeve_styling:{
    "Regular Sleeves":"Regular",
    "Regular Sleeve":"Regular"
  },
  multipack:{
    "Single":"1",
    "Single Pack":"1",
    "1 Pack":"1"
  },
  stretchability:{
    "No Stretch":"No",
    "Non Stretch":"No",
    "Non-Stretch":"No",
    "Nonstretch":"No",
    "Stretchable":"Yes"
  },
  number_of_pockets:{
    "No Pockets":"No Pocket",
    "No Pocket":"No Pocket"
  }
};

function resolveValueAlias(identifier,value){
  const map=VALUE_ALIASES[identifier];
  return map?map[String(value)]??value:value;
}

function getFieldOptionLabel(option){
  if(option===undefined||option===null)return null;

  if(
    typeof option==="string"||
    typeof option==="number"
  ){
    return String(option);
  }

  return(
    option?.variation_name??
    option?.name??
    option?.label??
    option?.value??
    option?.display_name??
    null
  );
}

function getMeeshoOptionValues(field){
  return(
    field?.props?.attribute?.values||[]
  )
  .map(getFieldOptionLabel)
  .filter(Boolean);
}

function findMatchingOption(field,value){
  const wanted=normalizeKey(value);

  return(
    field?.props?.attribute?.values||[]
  ).find(option=>{
    const label=getFieldOptionLabel(option);

    return(
      label!==null&&
      normalizeKey(label)===wanted
    );
  })||null;
}

async function fillField(
  identifier,
  value,
  report
){
  value=cleanValue(value);

  if(value===null)return false;

  const field=findPlainField(identifier);

  if(!field){
    report.skipped.push(identifier);
    return false;
  }

  setInputValue(
    field,
    value
  );

  const verified=await waitFor(
    ()=>valuesMatch(
      getCurrentFieldValueByIdentifier(
        identifier
      ),
      value
    ),
    2500,
    100
  );

  if(!verified){
    report.failed.push({
      field:identifier,
      error:
        `Field did not accept "${value}"`
    });

    return false;
  }

  report.filled.push(identifier);

  log(
    `Filled ${identifier}:`,
    value
  );

  return true;
}

async function selectReactDropdown(
  identifier,
  value,
  report
){
  value=cleanValue(value);

  if(value===null)return false;

  const originalIdentifier=identifier;
  const field=findReactField(identifier)||getAliases(identifier).map(alias=>findReactField(alias)).find(Boolean);

  if(!field){
    report.skipped.push(identifier);

    warn(
      `Dropdown field not found: ${identifier}`
    );

    return false;
  }

  const actualIdentifier=field.props?.attribute?.identifier||field.element.id||field.element.name||identifier;
  identifier=actualIdentifier;

  const originalValue=value;

  value=resolveValueAlias(
    identifier,
    value
  );

  if(
    !valuesMatch(
      originalValue,
      value
    )
  ){
    report.mapped.push({
      field:identifier,
      from:originalValue,
      to:value
    });

    log(
      `Mapped ${identifier}: ${originalValue} -> ${value}`
    );
  }

  const options=
    field.props?.attribute?.values||[];

  if(
    options.length&&
    !findMatchingOption(
      field,
      value
    )
  ){
    report.skipped.push(
      identifier
    );

    warn(
      `Option "${value}" not found for ${identifier}`,
      {
        available:
          getMeeshoOptionValues(
            field
          )
      }
    );

    return false;
  }

  const handler=
    findReactHandler(
      field.fiber,
      "onChange",
      identifier
    );

  if(handler){
    try{
      handler.props.onChange(
        handler.props.section,
        identifier,
        String(value)
      );

      let verified=
        await waitFor(
          ()=>valuesMatch(
            getCurrentFieldValueByIdentifier(
              identifier
            ),
            value
          ),
          2500,
          100
        );

      if(!verified){
        await sleep(250);

        handler.props.onChange(
          handler.props.section,
          identifier,
          String(value)
        );

        verified=
          await waitFor(
            ()=>valuesMatch(
              getCurrentFieldValueByIdentifier(
                identifier
              ),
              value
            ),
            2500,
            100
          );
      }

      if(verified){
        report.filled.push(
          identifier
        );

        log(
          `Selected ${identifier}:`,
          value
        );

        return true;
      }
    }catch(err){
      if(identifier==="surface_styling"){
        report.skipped.push(
          identifier
        );

        warn(
          `Optional dropdown skipped: ${identifier}`,
          err
        );

        return false;
      }

      error(
        `Dropdown failed: ${identifier}`,
        err
      );
    }
  }

  const multi=
    findReactHandler(
      field.fiber,
      "onChangeMultiDropdown"
    );

  if(multi){
    const wanted=
      Array.isArray(value)
        ?value
        :String(value)
          .split(",")
          .map(x=>x.trim())
          .filter(Boolean);

    const ids=[];

    for(
      const item of wanted
    ){
      const option=
        findMatchingOption(
          field,
          item
        );

      if(
        option&&
        option.id!==undefined
      ){
        ids.push(
          option.id
        );
      }
    }

    if(
      ids.length===
      wanted.length
    ){
      try{
        multi.props.onChangeMultiDropdown(
          ids
        );

        const verified=
          await waitFor(
            ()=>{
              const actual=
                getCurrentFieldValueByIdentifier(
                  identifier
                );

              return wanted.some(
                item=>
                  valuesMatch(
                    actual,
                    item
                  )
              );
            },
            2500,
            100
          );

        if(verified){
          report.filled.push(
            identifier
          );

          log(
            `Selected ${identifier}:`,
            wanted
          );

          return true;
        }
      }catch(err){
        error(
          `Multi dropdown failed: ${identifier}`,
          err
        );
      }
    }
  }

  report.failed.push({
    field:identifier,
    error:
      `Meesho did not accept "${value}"`
  });

  return false;
}

function normalizeSizeRows(
  product
){
  const data=
    product?.size_data??
    product?.sizeData??
    product?.sizes??
    product?.variants;

  if(!data)return[];

  if(Array.isArray(data)){
    return data.map(
      x=>({...x})
    );
  }

  if(typeof data==="object"){
    return Object.entries(
      data
    ).map(
      ([size,row])=>({
        size,
        ...(row||{})
      })
    );
  }

  return[];
}

function getRowValue(
  row,
  keys
){
  for(
    const key of keys
  ){
    const value=
      cleanValue(
        row?.[key]
      );

    if(value!==null){
      return value;
    }
  }

  const normalized={};

  for(
    const[
      key,
      value
    ] of Object.entries(
      row||{}
    )
  ){
    normalized[
      normalizeKey(key)
    ]=value;
  }

  for(
    const key of keys
  ){
    const value=
      cleanValue(
        normalized[
          normalizeKey(key)
        ]
      );

    if(value!==null){
      return value;
    }
  }

  return null;
}

function findSizeField(){
  return(
    collectReactFields().find(
      field=>{
        const ids=
          field.identifiers;

        return(
          ids.includes("size")||
          ids.includes("sizes")||
          ids.includes("variation")||
          normalizeKey(
            field.props.attribute?.name
          )==="size"
        );
      }
    )||null
  );
}

async function selectSizes(
  sizeNames,
  report
){
  if(
    !Array.isArray(
      sizeNames
    )||
    !sizeNames.length
  ){
    return false;
  }

  const wanted=
    sizeNames
      .map(String)
      .map(x=>x.trim())
      .filter(Boolean);

  const field=
    findSizeField();

  if(!field){
    report.skipped.push(
      "size"
    );
    return false;
  }

  const handler=
    findReactHandler(
      field.fiber,
      "onChangeMultiDropdown"
    );

  if(!handler){
    report.skipped.push(
      "size"
    );
    return false;
  }

  const options=
    field.props?.attribute?.values||[];

  const ids=[];

  for(
    const size of wanted
  ){
    const option=
      options.find(
        item=>
          normalizeKey(
            getFieldOptionLabel(
              item
            )
          )===
          normalizeKey(
            size
          )
      );

    if(
      !option||
      option.id===undefined
    ){
      report.skipped.push(
        "size"
      );

      warn(
        `Size "${size}" not available`
      );

      return false;
    }

    ids.push(
      option.id
    );
  }

  try{
    handler.props.onChangeMultiDropdown(
      ids
    );

    const verified=
      await waitFor(
        ()=>document.querySelectorAll(
          "#meesho_price"
        ).length>=wanted.length,
        6000,
        150
      );

    if(!verified){
      report.failed.push({
        field:"size",
        error:
          "Expected size rows were not created"
      });

      return false;
    }

    report.filled.push(
      "size"
    );

    log(
      "Selected sizes:",
      wanted
    );

    return true;
  }catch(err){
    report.failed.push({
      field:"size",
      error:String(err)
    });

    return false;
  }
}

function getVariantFieldElements(
  identifier
){
  try{
    return[
      ...document.querySelectorAll(
        `#${CSS.escape(identifier)}`
      )
    ];
  }catch(_){
    return[];
  }
}

function getVariantRowValue(
  row,
  identifier,
  product
){
  const value=
    getRowValue(
      row,
      getAliases(
        identifier
      )
    );

  return value!==null
    ?value
    :getProductValue(
      product,
      getAliases(
        identifier
      )
    );
}

function fillVariantRows(
  rows,
  product,
  report
){
  if(!rows.length)return;

  const ids=[
    "meesho_price",
    "only_wrong_return_price",
    "product_mrp",
    "inventory",
    "supplier_sku_id",
    "bust_size",
    "chest_size",
    "shoulder_size",
    "waist_size",
    "size_length",
    "length_size",
    "hip_size"
  ];

  for(
    const identifier of ids
  ){
    const fields=
      getVariantFieldElements(
        identifier
      );

    if(!fields.length)continue;

    for(
      let i=0;
      i<rows.length;
      i++
    ){
      const field=fields[i];

      if(!field)continue;

      let value=null;

      if(
        identifier===
        "meesho_price"
      ){
        value=
          getRowValue(
            rows[i],
            [
              "price",
              "meeshoPrice",
              "meesho_price",
              "sellingPrice",
              "selling_price"
            ]
          )??
          getProductValue(
            product,
            [
              "sellingPrice",
              "selling_price",
              "meeshoPrice",
              "meesho_price"
            ]
          );
      }else if(
        identifier===
        "only_wrong_return_price"
      ){
        value=
          getRowValue(
            rows[i],
            [
              "wrongReturn",
              "wrong_return",
              "wrongReturnPrice",
              "wrong_return_price",
              "wdrp"
            ]
          );
      }else if(
        identifier===
        "product_mrp"
      ){
        value=
          getRowValue(
            rows[i],
            [
              "mrp",
              "maximumRetailPrice",
              "maximum_retail_price"
            ]
          );
      }else if(
        identifier===
        "inventory"
      ){
        value=
          getRowValue(
            rows[i],
            [
              "inventory",
              "stock",
              "quantity"
            ]
          );
      }else if(
        identifier===
        "supplier_sku_id"
      ){
        value=
          getRowValue(
            rows[i],
            [
              "sku",
              "skuId",
              "sku_id",
              "supplier_sku_id"
            ]
          )??
          getProductValue(
            product,
            [
              "sku",
              "skuId",
              "sku_id"
            ]
          );
      }else{
        value=
          getVariantRowValue(
            rows[i],
            identifier,
            product
          );
      }

      value=
        cleanValue(value);

      if(value===null)continue;

      const existing=
        getFieldStateValue({
          element:field,
          props:getReactProps(
            field,
            ()=>true
          )?.props||{}
        });

      if(
        existing&&
        valuesMatch(
          existing,
          value
        )
      ){
        continue;
      }

      setInputValue(
        field,
        value
      );

      report.filled.push(
        `${identifier}[${i+1}]`
      );

      log(
        `Filled ${identifier} row ${i+1}:`,
        value
      );
    }
  }
}

function getVariantReactField(
  identifier,
  index
){
  const fields=
    getVariantFieldElements(
      identifier
    );

  const element=
    fields[index];

  if(!element){
    return null;
  }

  const react=
    getReactProps(
      element,
      props=>
        props?.attribute?.identifier===
        identifier
    );

  if(!react){
    return{
      element,
      fiber:getReactFiber(element),
      props:{}
    };
  }

  return{
    element,
    fiber:react.fiber,
    props:react.props
  };
}

async function fillMeasurement(
  identifier,
  values,
  report
){
  if(
    !Array.isArray(values)||
    !values.length
  ){
    return;
  }

  const fields=
    getVariantFieldElements(
      identifier
    );

  if(!fields.length)return;

  for(
    let i=0;
    i<values.length;
    i++
  ){
    const value=
      cleanValue(
        values[i]
      );

    const field=
      getVariantReactField(
        identifier,
        i
      );

    if(
      value===null||
      !field
    ){
      continue;
    }

    const current=
      getFieldStateValue(
        field
      );

    if(
      current&&
      valuesMatch(
        current,
        value
      )
    ){
      log(
        `Already filled ${identifier} row ${i+1}:`,
        value
      );

      continue;
    }

    const react=
      field.fiber
        ?findReactHandler(
          field.fiber,
          "onChange",
          identifier
        )
        :null;

    if(!react){
      report.skipped.push(
        `${identifier}[${i+1}]`
      );

      continue;
    }

    try{
      react.props.onChange(
        react.props.section,
        identifier,
        String(value)
      );

      let verified=
        await waitFor(
          ()=>valuesMatch(
            getFieldStateValue(
              field
            ),
            value
          ),
          2000,
          100
        );

      if(!verified){
        await sleep(250);

        react.props.onChange(
          react.props.section,
          identifier,
          String(value)
        );

        verified=
          await waitFor(
            ()=>valuesMatch(
              getFieldStateValue(
                field
              ),
              value
            ),
            2000,
            100
          );
      }

      if(verified){
        report.filled.push(
          `${identifier}[${i+1}]`
        );

        log(
          `Filled ${identifier} row ${i+1}:`,
          value
        );
      }else{
        const finalValue=
          getFieldStateValue(
            field
          );

        if(
          valuesMatch(
            finalValue,
            value
          )
        ){
          report.filled.push(
            `${identifier}[${i+1}]`
          );
        }else{
          report.failed.push({
            field:
              `${identifier}[${i+1}]`,
            error:
              `Measurement did not accept "${value}"`
          });
        }
      }
    }catch(err){
      report.failed.push({
        field:
          `${identifier}[${i+1}]`,
        error:
          String(err)
      });
    }
  }
}

async function fillMeasurements(
  rows,
  report
){
  if(!rows.length)return;

  const measurementMap={
    bust_size:[
      "bust_size",
      "bust",
      "chest_size",
      "chest"
    ],
    chest_size:[
      "chest_size",
      "chest",
      "bust_size",
      "bust"
    ],
    shoulder_size:[
      "shoulder_size",
      "shoulder"
    ],
    waist_size:[
      "waist_size",
      "waist"
    ],
    hip_size:[
      "hip_size",
      "hip"
    ],
    size_length:[
      "size_length",
      "length_size",
      "length"
    ],
    length_size:[
      "length_size",
      "length",
      "size_length"
    ]
  };

  for(
    const[
      identifier,
      keys
    ]of Object.entries(
      measurementMap
    )
  ){
    const fields=
      getVariantFieldElements(
        identifier
      );

    if(!fields.length)continue;

    const values=
      rows.map(
        row=>
          getRowValue(
            row,
            keys
          )
      );

    if(
      values.some(
        value=>value!==null
      )
    ){
      await fillMeasurement(
        identifier,
        values,
        report
      );
    }
  }
}

function normalizeImages(
  images
){
  if(!images)return[];

  if(Array.isArray(images)){
    return images.filter(
      Boolean
    );
  }

  if(typeof images==="string"){
    return[images];
  }

  if(typeof images==="object"){
    return[
      images.front,
      images.image1,
      images.image2,
      images.image3,
      images.image4,
      images.side,
      images.back,
      images.zoom,
      ...(
        Array.isArray(
          images.other_images
        )
          ?images.other_images
          :[]
      )
    ].filter(Boolean);
  }

  return[];
}

async function uploadProductImages(
  images
){
  const urls=
    normalizeImages(
      images
    );

  if(!urls.length)return false;

  const input=
    document.querySelector(
      "#addMoreImagesInput"
    );

  if(!input){
    warn(
      "#addMoreImagesInput not found"
    );
    return false;
  }

  let fiber=
    getReactFiber(
      input
    );

  let handler=null;

  while(fiber){
    const props=
      fiber.memoizedProps||{};

    if(
      typeof props.changeProductImages===
        "function"
    ){
      handler={
        fiber,
        props
      };
      break;
    }

    fiber=fiber.return;
  }

  if(!handler){
    warn(
      "changeProductImages handler not found"
    );
    return false;
  }

  try{
    handler.props.changeProductImages(
      urls
    );

    await sleep(1000);

    log(
      "Images assigned:",
      urls
    );

    return true;
  }catch(err){
    error(
      "Image assignment failed:",
      err
    );

    return false;
  }
}

function normalizeProduct(
  product
){
  if(
    !product||
    typeof product!=="object"
  ){
    throw new Error(
      "Invalid Product Genome data."
    );
  }

  return{
    ...product,

    product_id:
      product.product_id??
      product.productId??
      product.id,

    product_name:
      product.product_name??
      product.productName??
      product.title,

    style_code:
      product.style_code??
      product.styleCode,

    color:
      product.color??
      product.colour,

    colour:
      product.colour??
      product.color,

    net_weight:
      product.net_weight??
      product.netWeight??
      product.weight,

    hsn_code:
      product.hsn_code??
      product.hsnCode,

    size_data:
      product.size_data??
      product.sizeData,

    description:
      product.description??
      product.productDescription,

    attributes:
      product.attributes&&
      typeof product.attributes==="object"
        ?product.attributes
        :{}
  };
}

async function fillCommonFields(
  product,
  report
){
  const textFields={
    product_name:
      getProductValue(
        product,
        [
          "product_name",
          "title"
        ]
      ),

    product_weight_in_gms:
      getProductValue(
        product,
        [
          "product_weight_in_gms",
          "net_weight",
          "weight"
        ]
      ),

    supplier_product_id:
      getProductValue(
        product,
        [
          "style_code",
          "styleCode",
          "supplier_product_id"
        ]
      ),

    manufacturer_details:
      getProductValue(
        product,
        [
          "manufacturer_details"
        ]
      ),

    packer_details:
      getProductValue(
        product,
        [
          "packer_details"
        ]
      ),

    importer_details:
      getProductValue(
        product,
        [
          "importer_details"
        ]
      ),

    comment:
      getProductValue(
        product,
        [
          "description",
          "comment"
        ]
      )
  };

  for(
    const[
      key,
      value
    ]of Object.entries(
      textFields
    )
  ){
    if(value!==null){
      await fillField(
        key,
        value,
        report
      );
    }
  }

  const hsn=
    getProductValue(
      product,
      [
        "hsn_code",
        "hsnCode",
        "hsn",
        "hsn_id"
      ]
    );

  if(hsn!==null){
    const field=
      findReactField(
        "hsn_code"
      )||
      findReactField(
        "hsn_id"
      );

    if(field){
      const identifier=
        field.props?.attribute?.identifier||
        "hsn_code";

      if(
        field.props?.attribute?.values?.length||
        field.props?.attribute?.type===
          "DROPDOWN"
      ){
        await selectReactDropdown(
          identifier,
          hsn,
          report
        );
      }else{
        await fillField(
          identifier,
          hsn,
          report
        );
      }
    }
  }

  const common=[
    "color",
    "colour",
    "combo_of",
    "fabric",
    "fit_shape",
    "generic_name",
    "multipack",
    "no_of_compartments",
    "length",
    "neck",
    "occasion",
    "pattern",
    "print_or_pattern_type",
    "sleeve_length",
    "stitch_type",
    "country_of_origin",
    "brand",
    "ornamentation",
    "sleeve_styling",
    "surface_styling"
  ];

  const processed=new Set();

  for(
    const identifier of
    common
  ){
    const value=
      getAttributeValue(
        product,
        identifier
      );

    if(value!==null){
      const field=
        findReactField(identifier)||
        getAliases(identifier)
          .map(alias=>findReactField(alias))
          .find(Boolean);

      if(!field)continue;

      const actualIdentifier=
        field.props?.attribute?.identifier||
        field.element.id||
        field.element.name||
        identifier;

      if(processed.has(actualIdentifier))continue;

      processed.add(actualIdentifier);

      await selectReactDropdown(
        actualIdentifier,
        value,
        report
      );
    }
  }
}

async function fillDynamicAttributes(
  product,
  report
){
  const attributes=
    product?.attributes&&
    typeof product.attributes==="object"
      ?product.attributes
      :{};

  const flattened=
    flattenObject(
      attributes
    );

  const handled=
    new Set([
      "product_name",
      "product_weight_in_gms",
      "supplier_product_id",
      "manufacturer_details",
      "packer_details",
      "importer_details",
      "description",
      "comment",
      "hsn_code",
      "hsn_id",
      "color",
      "colour",
      "combo_of",
      "fabric",
      "fit_shape",
      "generic_name",
      "multipack",
      "no_of_compartments",
      "no._of_compartments",
      "length",
      "neck",
      "occasion",
      "pattern",
      "print_or_pattern_type",
      "print_type",
      "sleeve_length",
      "stitch_type",
      "country_of_origin",
      "brand",
      "ornamentation",
      "sleeve_styling",
      "surface_styling"
    ].map(
      normalizeKey
    ));

  const processed=new Set();

  for(
    const[
      path,
      rawValue
    ]of Object.entries(
      flattened
    )
  ){
    if(
      rawValue===null||
      rawValue===undefined||
      typeof rawValue==="object"
    )continue;

    const rawCandidates=[
      path,
      path.split(".").pop()
    ];

    let matchedKey=rawCandidates.find(
      candidate=>
        !handled.has(
          normalizeKey(
            candidate
          )
        )
    );

    if(
      rawCandidates.some(
        candidate=>
          handled.has(
            normalizeKey(
              candidate
            )
          )
      )
    ){
      continue;
    }

    if(!matchedKey){
      matchedKey=path;
    }

    const aliases=
      getAliases(
        matchedKey
      ).map(
        normalizeKey
      );

    const field=
      collectReactFields().find(
        candidate=>
          candidate.identifiers.some(
            identifier=>
              aliases.includes(
                identifier
              )
          )
      );

    if(!field){
      report.skipped.push(
        matchedKey
      );
      continue;
    }

    const identifier=
      field.props?.attribute?.identifier||
      field.element.id||
      field.element.name;

    if(!identifier){
      report.skipped.push(
        matchedKey
      );
      continue;
    }

    if(
      processed.has(
        identifier
      )
    ){
      continue;
    }

    processed.add(
      identifier
    );

    const value=
      resolveValueAlias(
        identifier,
        rawValue
      );

    const attribute=
      field.props?.attribute;

    if(
      attribute?.type==="DROPDOWN"||
      attribute?.values?.length
    ){
      await selectReactDropdown(
        identifier,
        value,
        report
      );
      continue;
    }

    const handler=
      findReactHandler(
        field.fiber,
        "onChange",
        identifier
      );

    if(handler){
      try{
        handler.props.onChange(
          handler.props.section,
          identifier,
          String(value)
        );

        const verified=
          await waitFor(
            ()=>valuesMatch(
              getCurrentFieldValueByIdentifier(
                identifier
              ),
              value
            ),
            2500,
            100
          );

        if(verified){
          report.filled.push(
            identifier
          );

          log(
            `Dynamic field filled: ${identifier}`,
            value
          );
        }else{
          report.failed.push({
            field:identifier,
            error:
              `Field did not accept "${value}"`
          });
        }
      }catch(err){
        report.failed.push({
          field:identifier,
          error:String(err)
        });
      }

      continue;
    }

    await fillField(
      identifier,
      value,
      report
    );
  }
}

function getRequiredMissingFields(){
  const missing=[];
  const seen=new Set();

  for(
    const field of
    collectReactFields()
  ){
    const identifier=
      field.props?.attribute?.identifier;

    if(
      !identifier||
      seen.has(identifier)
    )continue;

    seen.add(
      identifier
    );

    const attribute=
      field.props?.attribute;

    if(
      !attribute?.mandatory
    )continue;

    const current=
      getCurrentFieldValueByIdentifier(
        identifier
      ).trim();

    if(current)continue;

    const plain=
      findPlainField(
        identifier
      );

    if(
      plain&&
      String(
        plain.value??""
      ).trim()
    )continue;

    const reactValue=
      String(
        attribute?.value??""
      ).trim();

    if(reactValue)continue;

    missing.push(
      identifier
    );
  }

  return missing;
}

function validateProduct(
  product
){
  const warnings=[];
  const rows=
    normalizeSizeRows(
      product
    );

  for(
    const row of rows
  ){
    const price=
      Number(
        getRowValue(
          row,
          [
            "price",
            "meeshoPrice",
            "meesho_price",
            "sellingPrice",
            "selling_price"
          ]
        )
      );

    const wrongReturn=
      Number(
        getRowValue(
          row,
          [
            "wrongReturn",
            "wrong_return",
            "wrongReturnPrice",
            "wrong_return_price",
            "wdrp"
          ]
        )
      );

    const mrp=
      Number(
        getRowValue(
          row,
          [
            "mrp",
            "maximumRetailPrice",
            "maximum_retail_price"
          ]
        )
      );

    if(
      Number.isFinite(price)&&
      Number.isFinite(wrongReturn)&&
      Number.isFinite(mrp)&&
      !(
        wrongReturn<
        price&&
        price<
        mrp
      )
    ){
      warnings.push(
        `Invalid price order for ${row.size||"variant"}`
      );
    }
  }

  return warnings;
}

async function autofillProduct(
  product
){
  const report={
    success:false,
    filled:[],
    skipped:[],
    failed:[],
    warnings:[],
    requiredMissing:[],
    mapped:[]
  };

  try{
    const normalized=
      normalizeProduct(
        product
      );

    log(
      "Starting autofill:",
      normalized
    );

    await waitFor(
      ()=>collectReactFields().length>0||
        document.querySelector(
          "#product_name"
        ),
      10000,
      150
    );

    await fillCommonFields(
      normalized,
      report
    );

    const rows=
      normalizeSizeRows(
        normalized
      );

    const sizeNames=
      rows
        .map(
          row=>
            getRowValue(
              row,
              [
                "size",
                "variation",
                "variation_name"
              ]
            )
        )
        .filter(Boolean);

    if(
      sizeNames.length
    ){
      const sizeSelected=
        await selectSizes(
          sizeNames,
          report
        );

      if(sizeSelected){
        await waitFor(
          ()=>document.querySelectorAll(
            "#meesho_price"
          ).length>=
            sizeNames.length,
          10000,
          150
        );
      }

      fillVariantRows(
        rows,
        normalized,
        report
      );

      await fillMeasurements(
        rows,
        report
      );
    }else{
      const price=
        getProductValue(
          normalized,
          [
            "sellingPrice",
            "selling_price",
            "meeshoPrice",
            "meesho_price"
          ]
        );

      if(price!==null){
        await fillField(
          "meesho_price",
          price,
          report
        );
      }
    }

    if(
      normalized.images
    ){
      await uploadProductImages(
        normalized.images
      );
    }

    await fillDynamicAttributes(
      normalized,
      report
    );

    report.warnings=
      validateProduct(
        normalized
      );

    report.requiredMissing=
      getRequiredMissingFields();

    report.success=
      report.failed.length===0&&
      report.requiredMissing.length===0;

    log(
      "AUTOFILL COMPLETED:",
      report
    );

    return{
      ...report,
      product:normalized
    };
  }catch(err){
    report.failed.push({
      field:"autofill",
      error:String(err)
    });

    error(
      "AUTOFILL FAILED:",
      err
    );

    return{
      ...report,
      success:false
    };
  }
}

async function autofillProductGenome(
  productGenome
){
  return autofillProduct(
    productGenome
  );
}

async function fetchProductGenome(
  productId,
  apiBaseUrl="http://localhost:3000"
){
  if(
    productId===undefined||
    productId===null||
    productId===""
  ){
    throw new Error(
      "Product ID is required."
    );
  }

  const response=
    await fetch(
      `${apiBaseUrl}/products/${encodeURIComponent(productId)}`,
      {
        method:"GET",
        headers:{
          Accept:"application/json"
        }
      }
    );

  if(!response.ok){
    throw new Error(
      `Product API failed: ${response.status} ${response.statusText}`
    );
  }

  const product=
    await response.json();

  if(!product){
    throw new Error(
      `Product ${productId} was not found.`
    );
  }

  return product;
}

async function autofillProductById(
  productId,
  apiBaseUrl="http://localhost:3000"
){
  const product=
    await fetchProductGenome(
      productId,
      apiBaseUrl
    );

  return autofillProductGenome(
    product
  );
}

function inspectMeeshoFields(){
  return collectReactFields().map(
    field=>({
      id:
        field.element.id||"",

      name:
        field.element.name||"",

      identifier:
        field.props?.attribute?.identifier||
        "",

      attributeName:
        field.props?.attribute?.name||
        "",

      attributeType:
        field.props?.attribute?.type||
        "",

      mandatory:
        Boolean(
          field.props?.attribute?.mandatory
        ),

      currentValue:
        getCurrentFieldValue(
          field
        ),

      hasOnChange:
        Boolean(
          findReactHandler(
            field.fiber,
            "onChange",
            field.props?.attribute?.identifier
          )
        ),

      hasOnChangeMulti:
        Boolean(
          findReactHandler(
            field.fiber,
            "onChangeMultiDropdown"
          )
        ),

      options:
        getMeeshoOptionValues(
          field
        )
    })
  );
}

function inspectMeeshoField(
  identifier
){
  const field=
    findReactField(
      identifier
    )||
    getAliases(identifier)
      .map(alias=>findReactField(alias))
      .find(Boolean);

  if(!field)return null;

  return{
    id:
      field.element.id||"",

    name:
      field.element.name||"",

    identifier:
      field.props?.attribute?.identifier||
      "",

    attribute:
      field.props?.attribute||
      null,

    currentValue:
      getCurrentFieldValue(
        field
      ),

    hasOnChange:
      Boolean(
        findReactHandler(
          field.fiber,
          "onChange",
          field.props?.attribute?.identifier||identifier
        )
      ),

    hasOnChangeMulti:
      Boolean(
        findReactHandler(
          field.fiber,
          "onChangeMultiDropdown"
        )
      ),

    options:
      getMeeshoOptionValues(
        field
      )
  };
}

window.meeshoAutofill={
  autofillProduct,
  autofillProductGenome,
  autofillProductById,
  fetchProductGenome,
  normalizeProduct,
  normalizeSizeRows,
  selectReactDropdown,
  selectSizes,
  fillField,
  fillVariantRows,
  fillMeasurement,
  fillMeasurements,
  fillCommonFields,
  fillDynamicAttributes,
  uploadProductImages,
  validateProduct,
  getRequiredMissingFields,
  inspectMeeshoFields,
  inspectMeeshoField
};

log("Meesho autofill.js loaded.");
})();