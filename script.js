// edit this one
const pages = [
	{
		"id": "page_prematch",
		"title": "prematch",
		"items": [
			{"id": "scouter_name", "type": "text", "name": "scouter name"},
			{"id": "match_number", "type": "number", "name": "match #"},
			{"id":"team_number", "type": "number", "name": "team #"},
		]
	},
	{
		"id": "page_main",
		"title": "scout",
		"items": [
			{
				"type": "group", "folds": true, "direction": "row", "summary": "climbing/initialization", "child_props": {
					"style": "border: 1px solid gray;"
				}, "self_props": {"style": {"border": "3px dashed blue"}}, "items": [
					{
						"type": "group", "direction": "column", "items": [
			        {"id":"auton_moved", "type": "checkbox", "name": "moved in auton?"},
			        {"id":"auton_climb", "type": "radio", "name": "auton climb", "choices": [
			        	"climbed", "attempted", "not attempted"
			        ]},
						]
					},
			    {"id": "tele_climb", "type": "radio", "name": "teleop climb", "choices": [
			    	"level 1", "level 2", "level 3", "attempted", "not attempted"
			    ]}
				]
			},
			{"id": "comments", "type": "text", "name": "comments"},
			{"type": "group", "direction": "column", "self_props": {"style": {"border": "3px dashed orange"}}, "items": [
				{"id": "auton_neutral_passes", "type": "counter", "name": "(auton) pass from neutral zone", "increment": 3},
				{"id": "tele_neutral_passes", "type": "counter", "name": "(teleop) pass from neutral zone", "increment": 3}
			]},
			{"type": "group", "direction": "row", "self_props": {"style": {"border": "2px dashed purple"}}, "items": [
			  {"type": "group", "direction": "column", "items": [
			  	{"id": "balls_shot", "type": "slider", "name": "shot", "min": 0, "max": 100, "increment": 3},
			  	{"id": "balls_missed", "type": "slider", "name": "missed", "min": 0, "max": 100, "increment": 3},
			  ]},
			  {"type": "group", "direction": "column", "self_props": {"style": {"flex": "1"}}, "child_props": {"style": {"flex": "1"}}, "items": [
					{"label": "PUSH", "type": "button", "onclick": () => {
						app.tables["sprees"].push();
					}}
				]},
			]},
			{"id": "sprees", "type": "table", "columns": ["balls made", "balls missed"], "inputs": [
				"balls_shot", "balls_missed"
			], "first_row_label": "A"},
		  {"label": "* POP *", "type": "button", "onclick": () => {
		  	app.tables["sprees"].pop();
		  }}
		]
	},
	{
		"id": "page_export",
		"title": "export",
		"skip": true,
		"items": []
	}
];

// use as reference
const types = {
	/*
		-> item=text, item=number, item=checkbox: {
			name: _,
			id: _
		}
	*/
	"text": (item) => inputWithLabel(item.name, null, {'id': item.id}),
	"number": (item) => inputWithLabel(item.name, "number", {'id': item.id}),
	"checkbox": (item) => inputWithLabel(item.name, "checkbox", {"id": item.id}, false, true),

	 /*
   -> item=slider: {
     name: _,
     id: _,
     min: 0,
     max: 100,
		 step: 1
	 }
	 */
	"slider": (item) => inputWithLabel(
		item.name, "range", {
			"min": item.min ? item.min : 0,
			"max": item.max ? item.max : 100,
			"step": item.increment ? item.increment : 1,
			"value": item.min ? item.min : 0,
			'id': item.id
		}, true
	),

	/* 
  -> item=radio: {
    name: _,
    id: _,
    choices: [choice...]
  }
	*/
	"radio": (item) => {
		let collection = document.createElement('div');
		collection.style.display = 'flex';
		collection.style.flexDirection = 'column';

		let title = document.createElement('em');
		title.innerHTML = item.name;

		collection.appendChild(title);

		for(let i = 0; i < item.choices.length; i++) {
			collection.appendChild(
				// id system is alright
				inputWithLabel(item.choices[i], "radio", {"name": item.id, "id": `${item.id}${i}`}, false, true)
			);
		}

		return collection;
	},

	/*
	-> item=group: {
		direction: "row"|"column",
		child_props: {prop: val...},
		self_props: {prop: val...},
		folds: true|false,
		summary: _
	}
	*/
	"group": (item) => {
		let rowElement = parsePage(item);
		let details;
		rowElement.style.display = 'flex';
		rowElement.style.flexDirection = item.direction;
		rowElement.classList.add(`group-${item.direction}`);


		if (item.folds) {
			details = document.createElement('details');
			details.display = 'flex';
			details.flexDirection = 'column';
			details.open = true;

			let summary = document.createElement('summary');
			summary.innerHTML = (item.summary ? item.summary : "Group");

			details.appendChild(summary);
			details.appendChild(rowElement);
		}

		if(item.hasOwnProperty('self_props')) {
		  rowElement = setProperties(rowElement, item.self_props);
		}

		return item.folds ? details : rowElement;
	},

	/* 
	-> item=table: {
		id: _,
		columns: [column...],
		inputs: [{type: _, id: _}...],
		first_row_label?: _
	}
	*/
	"table": (item) => {
		let container = document.createElement('div');
		container.id = item.id;

		let inputs = [];
		for(const input of item.inputs) {
			inputs.push(getItemById(input));
		}

		app.tables[item.id] = item.first_row_label ? new Table(item.id, item.columns, inputs, item.first_row_label) : new Table(item.id, item.columns, item.inputs);
		container.appendChild(app.tables[item.id].render(true));
		
		return container;
	},

	/*
	-> item=counter: {
		name: _,
		id: _,
		increment: _
	}
	*/
	"counter": (item) => {
		let element = document.createElement('div');
		let counter = document.createElement('div');
		counter.style.display = 'flex';
		counter.style.flexDirection = 'row';

		let title = document.createElement('label');
		title.innerHTML = item.name;
		element.appendChild(title);

		let tracker = document.createElement('input');
		tracker.type = 'number';
		tracker.id = item.id;
		tracker.value = 0;

		let incrementButton = document.createElement('button');
		incrementButton.innerHTML = `+${item.increment}`;
		incrementButton.style.padding = '15px 25px';
		incrementButton.onclick = (event) => {
			document.getElementById(item.id).value = parseInt(document.getElementById(item.id).value) + item.increment;
		}

		let decrementButton = document.createElement('button');
		decrementButton.innerHTML = `-${item.increment}`;
		decrementButton.style.padding = '15px 25px';
		decrementButton.onclick = (event) => {
			let newValue = parseInt(document.getElementById(item.id).value) - item.increment;

			if (newValue >= 0) {
			  document.getElementById(item.id).value = newValue;
			}
		}

		counter.appendChild(decrementButton);
		counter.appendChild(tracker);
		counter.appendChild(incrementButton);

		element.appendChild(counter);
		
		return element;
	},

	/*
	-> item=button: {
		label: _,
		onclick: function
	}
	*/
	"button": (item) => {
		let button = document.createElement('button');
		button.innerHTML = item.label;
		button.onclick = item.onclick;

		return button;
	}
}

// not defined in here? will fetch from input id
// no id? returns null? no value!
const fetchers = {
	"table": (item) => {
		let combined = '';

		for(const row of app.tables[item.id].rows) {
			combined += row.join(',') + ';';
		}

		return combined;
	},
	"radio": (item) => {
		for(let i = 0; i < item.choices.length; i++) {
			if(document.getElementById(`${item.id}${i}`).checked) {
				return i;
			}
		}
		return "UNSELECTED";
	},
	"slider": (item) => {
		return document.getElementById(item.id).value;
	},
	"checkbox": (item) => {
		return document.getElementById(item.id).checked ? 1 : 0;
	}
}

// globals namespace
let app = {
	"active_page": 0,
	// couldnt figure out a smarter way in 10 minutes so im doing this
	"tables": {}
}

/*
-> _label = the text on the label next to the input
-> type   = the type of input (sets type property of input element)

-> props?: {prop: val...} = the properties of the input element
-> track_value?: bool     = whether the element should have a label which tracks the value of it (for sliders)
-> flip?: bool            = whether to put the

<- $ div.input_group containing input of type {type} with label {label} with properties {props}
*/
function inputWithLabel(_label, type, props={}, track_value=false, flip=false) {
	let group = document.createElement('div');
	group.classList.add('input_group');

	let input = document.createElement('input');
	if(type){input.type = type;}
	input.placeholder = _label;

	input = setProperties(input, props);

	let label = document.createElement('label');
	label.innerHTML = _label;

	if(props.id) {
		input.id = props.id;
		label.htmlFor = props.id;
	}

	if(!flip) {
	  group.appendChild(label);
	  group.appendChild(input);
	} else {
    group.appendChild(input);
    group.appendChild(label);
	}

	if(track_value) {
		input.oninput = (event) => {
			event.target.parentElement.querySelector('b').innerHTML = event.target.value;
		}

		let b = document.createElement('b');
		b.innerHTML = input.value;

		group.appendChild(b);
	}

	return group;
}

// -> page_to_scroll_to
// - scrolls to page
function scrollToPage (to) {
	for(let i = 0; i < pages.length; i++) {
		let page = document.getElementById(pages[i].id);
		if(i == to) {
			page.style.display = '';
		} else {
			page.style.display = 'none';
		}
	}
}

// -> pages_to_advance
// - scrolls to page
function scrollPageRelative (add) {
	if((app.active_page+add) >= 0 && (app.active_page+add) < pages.length) {
		app.active_page += add;
		scrollToPage(app.active_page);
	}
}

// <- $ div containing navigation buttons
function navigationButtons() {
  let pageNavigationGroup = document.createElement('div');
  pageNavigationGroup.classList.add('page_navigation_group');
  
  let nextButton = document.createElement('button');
  nextButton.innerHTML = 'next';
  nextButton.onclick = () => scrollPageRelative(1);
  
  let backButton = nextButton.cloneNode();
  backButton.innerHTML = 'back';
  backButton.onclick = () => scrollPageRelative(-1);
  
  let pagesLabel = document.createElement('label');
  pagesLabel.innerHTML = 'pages';
  
  pageNavigationGroup.append(backButton);
  pageNavigationGroup.append(pagesLabel);
  pageNavigationGroup.append(nextButton);

	return pageNavigationGroup;
}

/*
-> page: {
	items: [{type: types[*]}...],
	child_props: {prop: val...},
	self_props: {prop: val...}
}

<- $ div containing parsed page/group
*/
function parsePage(page) {
  let pageElement = document.createElement('div');

  for(const item of page.items) {
  	if (!types.hasOwnProperty(item.type)) {
  		console.error(`Item cannot have type "${item.type}"`);
  		console.log(item);
  		continue;
  	}

		if(!item.hasOwnProperty('id') && ['group', 'button'].indexOf(item.type) == -1) {
			console.log(`Warn: Element ${item.name ? item.name : `with type ${item.type}`} has no ID. Should it?`)
		}

  	let newItem = types[item.type](item);
  
  	if(!page.child_props || !page.hasOwnProperty('child_props')) {
  	  pageElement.appendChild(newItem);
  		continue;
  	}
  
		newItem = setProperties(newItem, page.child_props);
  
  	pageElement.appendChild(newItem);
  }

	return pageElement;
}

/*
-> id = item id
<- item: {...}
*/
function getItemById(id) {
	const recursor = (id, parse) => {
	  for(const item of parse.items) {
	  	if(item.type == 'group') {
	  		let result = recursor(id, item);
	  		if(result) {return result;}
	  	}
	  	
	  	if(item.id == id) {
	  		return item;
	  	}
	  }
	  return null;
	}

	for(const page of pages) {
		let result = recursor(id, page);
		if(result) {
			return result;
		}
	}
	return null;
}

/*
-> item: {
	type: _,
	id: _
}
<- value
*/
function getValue(item) {
	let value = null;
	if(fetchers.hasOwnProperty(item.type)) {
		value = fetchers[item.type](item);
	} else {
		let el = document.getElementById(item.id);
		el ? value = el.value : null
	}
	return value;
}

/*
<- values of all items
*/
function getAllValues() {
	let sniffItems = (items) => {
		let values = [];

		for(const item of items) {
			if(item.type == 'group') {
				values = values.concat(sniffItems(item.items));
				continue;
			}

			if(!item.hasOwnProperty('id')) {
				continue;
			}

			let value = getValue(item);

			if(value == null){
				continue
			}

			values.push(value)
		}

		return values;
	}

	for(const page of pages) {
		if(!page.skip) {
			console.log(sniffItems(page.items));
		}
	}
}

/*
-> element = element to operate on
-> properties = dict of properties ({style: {border: ...}...})

<- $ element with properties set
*/
function setProperties(element, properties, path=[]) {
	for(const [prop, val] of Object.entries(properties)) {
		if(typeof val == "object") {
			element = setProperties(element, val, path.concat(prop));
			continue;
		}
		let lastChain = element;
		for(const chain of path) {
			lastChain = element[chain];
		}
		lastChain[prop] = val;
	}
	return element;
}

class Table {
	constructor(id, columns, inputs, first_row_label='0') {
		this.id = id;
		this.pulled = null; // set to row index pulled
		this.rows = [];
		this.columns = columns;
		this.inputs = inputs;

		this.first_row_label = first_row_label;

		return this;
	}

	render(return_element=false) {
		let table = document.createElement('table');

		let header = document.createElement('tr');

		let cols = ['#'];
		cols = cols.concat(this.columns);
		cols.push('pull');

		cols.forEach((c,i) => {
			let column = document.createElement('th');
			column.innerHTML = c;

			header.appendChild(column);
		});

		table.appendChild(header);

		for(const index in this.rows) {
			let rowEl = document.createElement('tr');

			let pullButton = document.createElement('button');
			pullButton.innerHTML = 'pull';
			pullButton.onclick = (() => {
				app.tables[this.id].pullRow(index);
			})

			let row = [index == 0 ? this.first_row_label : index].concat(this.rows[index]).concat([pullButton]);
			row.forEach((input, i) => {
				let data = document.createElement('td');
				let val = (this.pulled == index && i > 0) ? 'PULL' : input;

				if(typeof val == "object" && val.tagName != undefined) {
				  data.appendChild(val);
				} else {
					data.innerHTML = val.toString();
				}

				rowEl.appendChild(data);
			})
			table.appendChild(rowEl);
		}

		if(return_element) {
			return table;
		} else {
			document.getElementById(this.id).innerHTML = '';
			document.getElementById(this.id).appendChild(table);
		}
	}

	addRow(values) {
		this.rows.push(values);
	}

	// fetches values of inputs
	getValues() {
		let vals = [];
		for(const input of this.inputs) {
			vals.push(getValue(input));
		}
		return vals;
	}

	push() {
		if(this.pulled != null) {
			this.editRow(this.pulled, this.getValues());
			this.pulled = null;
		} else {
			this.addRow(this.getValues());
		}
		this.render();
	}

	pop() {
		this.rows.pop();
		this.render();
	}

	pullRow(row_index) {
		this.pulled = row_index;
		this.render();
	}

	editRow(pulled_row_index, values) {
		this.rows[pulled_row_index] = values;
	}

	getRow(row_index) {
		return this.rows[row_index];
	}
}

/*
 - parses pages listed in global and scrolls to page 0
*/
function init (_pages) {
	for(const page of pages) {
		document.getElementById(page.id).classList.add('page');

		let title = document.createElement('h1');
		title.classList.add('page_title');
		title.innerHTML = page.title;
		
		document.getElementById(page.id).appendChild(title);

		let pageContentBox = parsePage(page);
		pageContentBox.classList.add('page_content');

		document.getElementById(page.id).appendChild(pageContentBox);
		document.getElementById(page.id).appendChild(navigationButtons());
	}
  scrollToPage(0);
}

init();
