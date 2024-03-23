(()=>{
	var sheetsCount = document.styleSheets.length
	document.head.appendChild(document.createElement('style'))
	const style = document.styleSheets[sheetsCount]
	delete sheetsCount;
	HTMLElement.prototype.hide = function(visibility){
		this.style.visibility = visibility?"inherit":"collapse";
	}
	HTMLElement.prototype.show = function(visibility){
		this.hide(!visibility)
	}
	HTMLElement.prototype.isVisibled = function(visibility){
		return this.style.visibility!="collapse"&&this.style.visibility!="hidden"
	}
	HTMLElement.prototype[Symbol.toPrimitive] = function(hint) {
		return `${this.tagName}${this.id?"#"+this.id:""}${[...this.classList].map(x=>"."+x).join('')}${[...this.attributes].join('')}`
	}
	const JSONAPI = JSON
	class JSONObject extends Object{
		constructor(object){
			super()
			Object.assign(this,object)
		}
		static parse(json){
			return new JSONObject(JSONAPI.parse(json))
		}
		static stringify(object){
			return JSONAPI.stringify(object)
		}
	}
	JSONObject.prototype[Symbol.toPrimitive] = function(hint) {
		return JSONAPI.stringify(this)
	}
	Attr.prototype[Symbol.toPrimitive] = function(hint) {
		return `[${this.name}="${this.value}"]`
	}
	
	// copy CUSTOM ICON support
	const SVGNS = "http://www.w3.org/2000/svg"
	function icon(i){
		var svg = document.createElementNS(SVGNS,"svg")
		svg.setAttribute("viewBox","0 0 24 24")
		svg.setAttribute("width","1em")
		svg.setAttribute("height","1em")
		var use = document.createElementNS(SVGNS,"use")
		use.setAttributeNS("http://www.w3.org/1999/xlink","href",`#${i}`)
		svg.appendChild(use)
		return svg
	}
	
	/**
		Allow to write CSS in JS
		@params {String} selector see CSS Selectors
		@params {String} rule see CSS Rules
		@params {Number} priority set the priority
	*/
	function setRule(selector,rule,priority){
		style.insertRule(`${selector}{${rule}}`,priority)
	}
	
	const elements = {}
	function addID(el,doc){
		if(! doc[el.id]){
			doc[el.id] = el
		}else if(debug && doc[el.id] != el){
			console.info(`ID ${el.id} raise an error but you can acess to the element with \`ids[name]\` \n CAUSED BY : ${doc.ids[el.id]?"an other element with same ID":"Native object with same name"}`)
		}
		doc.ids[el.id] = el.id
	}
	function generateIDs(){
		window.ids = {}
		document.querySelectorAll('*:not(template) [id]')?.forEach(el=>{
			addID(el,window)
		})
	}
	
	// update slots
	function updateView(doc = document.body,parent){
		generateSlots(doc,parent)
	}
	
	const templates = {}
	function generateTemplates(){
		for(var template of document.querySelectorAll('template')){
			template.name = template.getAttribute("name")
			var build_template = ((template)=>{
				return _=>{
					var doc = document.importNode(template.content, true)
					doc.ids = {}
					doc.querySelectorAll('[id]')?.forEach(el=>{
						addID(el,doc)
					})
					updateView(doc,template)
					return doc
				}
			})(template)
			build_template.name = template.name
			templates[template.name] = build_template
		}
		window.templates = templates
	}
	function convertType(value,type){
		switch(type){
			case "number":value = new Number(value)
			default:;
		}
		return value
	}
	
	const slots = {}
	const slots_see = {}
	function updateSlot(element,name,slots_see){
		var value = slots_see[name].value
		switch(element.tagName){
			case "SELECT":
			case "INPUT": element.value = value;break
			case "PROGRESS":
				var number = new Number(value)*1
				if(Number.isFinite(number))
					element.value = number;break
			case "I":element.getAttribute("icon",value);break
			case "TEMPLATE":;break
			default:
				element.textContent = value
		}
	}
	function generateSlots(doc = document.body,parent = {}){
		var slotsValue = slots
		var slotsSave = slots_see
		// TEMPLATE support
		if(parent.tagName=="TEMPLATE" && parent.hasAttribute('slot')){
			var name = parent.getAttribute('slot')
			var obj = {}
			var obj2 = {}
			slots[name].add(obj)
			slots_see[name] = obj2
			slotsValue = obj
			slotsSave = obj2
		}
		// SLOT and [SLOT] support
		for(var slot of doc.querySelectorAll('slot,[slot]')){
			((slot,slots,slots_see)=>{
				var name = slot.tagName=="SLOT"?(slot.getAttribute('name')||slot.name):slot.getAttribute('slot')
				if(slot.tagName == "TEMPLATE"){
					slot.getAttribute('slot')
					slots[name] = new Set()
					slots[name].delete = function(item){
						slots[name].delete(item)
						slots_see[name].elements.forEach(element=>{
							element.remove()
						})
					}
					slots[name].applyFiltering = function(list){
						slots[name].forEach(item=>{
							if(list.includes(item)){
								item.show()
							}else{
								item.hide()
							}
						})
					}
					return
				}
				function update(noallow){
					slots_see[name].elements.forEach(el=>{if(noallow == el)return;updateSlot(el,name,slots_see)})
					if(noallow){
						var ev = new CustomEvent("slotupdate")
						ev.element = noallow
						ev.slotName = name
						ev.slotValue = slots_see[name].value
						window.dispatchEvent(ev)
					}
				}
				// When Update
				// SELECT and INPUT support (.value)
				if( slot.tagName == "SELECT" || slot.tagName == "INPUT"  || slot.tagName == "PROGRESS" ){
					slot.addEventListener('change',()=>{
						slots_see[name].value = convertType(slot.value,slot.type)
						update(slot)
					})
				}
				// TEXTAREA support (.textContent)
				if( slot.tagName == "TEXTAREA" ){
					slot.addEventListener('keydown',()=>{
						slots_see[name].value = slot.value
						update(slot)
					})
				}
				// if slots has not this slot -> create it
				if(!slots_see[name])slots_see[name] = {elements:[],value:""}
				slots_see[name].elements.push(slot)
				// define public access
				if(!Object.getOwnPropertyDescriptor(slots,name)){
					Object.defineProperty(slots,name,{
						get(){
							return slots_see[name].value
						},
						set(value){
							slots_see[name].value = value
							update()
						}
					})
				}
			})(slot,slotsValue,slotsSave)
		}
		window.slots = slots
	}
	class EventPromised {
		
	}
	EventPromised.prototype = Object.assign(EventPromised.prototype,Promise.prototype,EventTarget.prototype,{
		then(){},
		catch(){},
		finally(){},
		addEventListener(){},
		dispatchEventListener(){},
		removeEventListener(){},
	})
	console.log(EventPromised)
	class FetchResponse extends EventTarget{
		#body
		get body(){return this.#body}
		#headers
		get headers(){return this.#headers}
		#ok
		get ok(){return this.#ok}
		#redirected
		get redirected(){return this.#redirected}
		#status
		get status(){return this.#status}
		#statusText
		get statusText(){return this.#statusText}
		#type
		get type(){return this.#type}
		#url
		get url(){return this.#url}
		#readyState 
		get readyState (){return this.#readyState }
		#controller
		#response
		constructor(responsePromise,controller){
			super()
			this.#controller = controller;
			(controller.signal||controller).addEventListener('abort',()=>{
				this.#timeout()
			})
			this.#setReadyState(0)
			responsePromise.then(async response=>{
				this.#response = response
				this.#setReadyState(1)
				this.#headers = response.headers
				this.#setReadyState(2)
				this.#ok = response.ok
				this.#redirected = response.redirected
				this.#status = response.status
				this.#statusText = response.statusText
				this.#type = response.type
				this.#url = response.url
				this.#setReadyState(3)
				this.#loadstart()
				const that = this
				const writableStream = new WritableStream({
					write(chunk){
						total += chunk.length;
						body.push(chunk)
						that.#progress(total)
					},
					close(){
						/*
						const clazz = body[0]?.constructor
						if(clazz){
							that.#body = new clazz(body.flatMap(x=>{return [...x]}))
							delete body;
						}
						*/
						that.#body = new Blob(body,{type:response.type,})
						that.#loaded()
						
						that.#setReadyState(4)
						that.#loadend()
					}
				})
				const stream = response.body
				var body = []
				this.#body = []
				var total = 0
				stream.pipeTo(writableStream)
			})
			.catch(err=>{
				this.#error(err)
				this.#loadend()
				console.error(err)
			})
		}
		//Events
		#setReadyState(readyState){
			this.#readyState = readyState
			this.dispatchEvent(new CustomEvent('readystatechange'))
		}
		#timeout(){
			this.dispatchEvent(new CustomEvent('timeout'))
		}
		#progress(loaded){
			var e = new CustomEvent('progress')
			e.loaded = loaded
			this.dispatchEvent(e)
		}
		#loadstart(){
			this.dispatchEvent(new CustomEvent('loadstart'))
		}
		#loadend(){
			this.dispatchEvent(new CustomEvent('loadend'))
		}
		#loaded(){
			this.dispatchEvent(new CustomEvent('load'))
		}
		#error(err){
			this.dispatchEvent(new ErrorEvent('error',err))
		}
		abort(){
			this.#controller.abort()
			this.dispatchEvent(new CustomEvent('abort'))
		}
		#isload = false
		#whenLoaded(callback){
			if(this.#isload){
				callback()
			}else{
				this.addEventListener('load',()=>{
					this.#isload=true
					callback()
				})				
			}
		}
		//Readers
		arrayBuffer(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					resolve(this.body.arrayBuffer())
				})
			})
		}
		blob(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					resolve(this.body)
				})
			})
		}
		formData(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					resolve(this.#response.formData())
				})
			})
		}
		json(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					this.body.text().then(text=>{
						try{
							resolve(JSON.parse(text))
						}catch(e){
							reject(e)
						}
					})
					.catch(reject)
				})
			})
		}
		text(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					resolve(this.body.text())
				})
			})
		}
		xml(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(()=>{
					this.body.text().then(text=>{
						try{
							resolve(XML.parseFromString(text,this.type))
						}catch(e){
							reject(e)
						}
					})
					.catch(reject)
				})
			})
		}
		data(){
			return new Promise((resolve,reject)=>{
				this.#whenLoaded(async ()=>{
					const getData = ()=>{
						var type = this.#headers.get("content-type").split(';')[0]
						switch(type){
							case "application/json":return this.json();
							case "text/xml":return this.xml();
							case "multipart/form-data":return this.formData();
							case "text/plain":return this.text();
							default: return this.blob();
						}
					}
					const data = await getData()
					resolve(data)
				})
			})
		}
	}
	const OriginalFecth = fetch
	async function fetchAJAX(request,options={}){
		var controller;
		if(!options.signal){
			controller = new AbortController();
			options.signal = controller.signal
		}else{
			controller = options.signal
		}
		return new FetchResponse(OriginalFecth(request,options),controller)
	}
	Blob.prototype.createObjectURL = function(){
		return URL.createObjectURL(this)
	}
	class WebService extends EventTarget{
		constructor(url){
			super()
			var build = {
				onmessage:(message)=>{
					var eve = new CustomEvent("message")
					eve.message = message
					this.dispatchEvent(eve)
				}
			}
			if(url.startsWith("ws")){
				build.post
			}else{
				build.post = function(message){
					fetchAJAX(url+message)
					.then(res=>{
						res.data().then(content=>{
							build.onmessage(content)
						})
					})
				}
				
			}
			this.post = (message)=>{
				build.post(message)
			}
		}
	}
	function alert(message){
		return new Promise(resolve=>{
			const dialog = document.createElement('dialog')
			const button = document.createElement('button')
			button.textContent = "\u2715"
			dialog.append(
				document.createTextNode(message),
			button)
			button.addEventListener('click',()=>{
				dialog.close()
			})
			dialog.addEventListener('close',()=>{
				dialog.remove()
				resolve()
			})
			document.body.appendChild(dialog)
			dialog.showModal();
		})
	}
	function prompt(message){
		return new Promise(resolve=>{
			const dialog = document.createElement('dialog')
			const label = document.createElement('label')
			label.textContent = message
			const input = document.createElement('input')
			const button = document.createElement('button')
			button.textContent = "OK"
			dialog.append(label,input,button)
			dialog.addEventListener('change',()=>{
				dialog.close()
			})
			button.addEventListener('click',()=>{
				dialog.close()
			})
			dialog.addEventListener('close',()=>{
				dialog.remove()
				resolve(input.value)
			})
			document.body.appendChild(dialog)
			dialog.showModal();
		})
	}
	function confirm(message){
		return new Promise(resolve=>{
			const dialog = document.createElement('dialog')
			const buttonAccept = document.createElement('button')
			buttonAccept.textContent = "accept"
			const buttonReject = document.createElement('button')
			buttonReject.textContent = "reject"
			dialog.append(document.createTextNode(message),buttonAccept,buttonReject)
			buttonAccept.addEventListener('click',()=>{
				dialog.close()
				resolve(true)
			})
			buttonReject.addEventListener('click',()=>{
				dialog.close()
				resolve(false)
			})
			dialog.addEventListener('close',()=>{
				dialog.remove()
			})
			document.body.appendChild(dialog)
			dialog.showModal();
		})
	}
	window.setRule = setRule
	window.fetch = fetchAJAX
	window.XML = new DOMParser()
	window.JSON = JSONObject
	window.WebService = WebService
	window.alert = alert
	window.prompt = prompt
	window.confirm = confirm
	let debug = true
	function birdInit(){
		generateIDs()
		generateSlots()
		generateTemplates()
		window.removeEventListener('load',birdInit)
	}
	window.addEventListener('load',birdInit)
})()