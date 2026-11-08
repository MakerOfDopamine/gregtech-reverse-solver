let balance = {
    resources: {

    },
    process: {

    },
    target: null
    //process_names: new Set()
}

const PRESETS = [
    // Gears and iron: simple chain
    '{"resources":{"iron":0,"ingot":1,"gear":1},"process":{"Process0":{"inputs":{"iron":3},"outputs":{"ingot":2},"power":5,"time":1,"allow_overclocking":true,"perfect_overclock":false},"Process1":{"inputs":{"ingot":5},"outputs":{"gear":1},"power":4,"time":2,"allow_overclocking":true,"perfect_overclock":false}},"process_names":{}}',
    
    // Vinyl chloride: looping chains
    '{"resources":{"ethylene":0,"salt":0,"water":0,"oxygen":0,"chlorine":1,"EDC":1,"hydrochloric_acid":1,"hydrogen":1,"sodium_hydroxide":1,"vinyl_chloride":1},"process":{"Electrolysis":{"inputs":{"salt":2,"water":2},"outputs":{"chlorine":1,"hydrogen":1,"sodium_hydroxide":2},"power":10,"time":1,"allow_overclocking":true,"perfect_overclock":false},"Chlorination":{"inputs":{"ethylene":1,"chlorine":1},"outputs":{"EDC":1},"power":1,"time":1,"allow_overclocking":true,"perfect_overclock":false},"Oxychlorination":{"inputs":{"ethylene":2,"hydrochloric_acid":4,"oxygen":1},"outputs":{"EDC":2,"water":2},"power":3,"time":1,"allow_overclocking":true,"perfect_overclock":false},"Cracking":{"inputs":{"EDC":1},"outputs":{"vinyl_chloride":1,"hydrochloric_acid":1},"power":4,"time":1,"allow_overclocking":true,"perfect_overclock":false}},"process_names":{}}',

    // Gears, Presses and Hammers: differing results by solve mode
    '{"resources":{"iron":0,"plate":1,"gear":1},"process":{"Press":{"inputs":{"iron":1},"outputs":{"plate":1},"power":10,"time":1,"allow_overclocking":true,"perfect_overclock":false},"Hammer":{"inputs":{"iron":1},"outputs":{"plate":1},"power":1,"time":4,"allow_overclocking":true,"perfect_overclock":false},"Assembler":{"inputs":{"plate":2},"outputs":{"gear":1},"power":2,"time":1,"allow_overclocking":true,"perfect_overclock":false}}}',
]

document.getElementById("add-resource").addEventListener('submit', (e) => {
    e.preventDefault()

    addResource(document.getElementById('add-resource-input').value)
    document.getElementById('add-resource-input').value = ""
})

document.getElementById("remove-resource").addEventListener('submit', (e) => {
    e.preventDefault()

    removeResource(document.getElementById('remove-resource-input').value)
    document.getElementById('remove-resource-input').value = ""
})

document.getElementById("add-process").addEventListener('submit', (e) => {
    e.preventDefault()

    createProcess(document.getElementById('add-process-input')?.value)
})

function getGenericProcessName() {
    /*let least_unused = 0
    while (balance.process_names.has(least_unused)) least_unused += 1
    return least_unused*/
    // It turns out that sets don't play nice with stringify.
    let alphabet = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
    let name = Array(10).fill(0)
    name.forEach((v, i) => {
        name[i] = alphabet[Math.floor(Math.random() * 52)]
    })
    return name.join("")
}

function addResource(id) {
    if (id === "" || id === null) {
        return 0
    }

    id = id.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")
    
    if (balance.resources[id] != undefined) {
        alert(`Resource ${id} is already defined!`)
        return 0
    }

    balance.resources[id] = 1
    updateDisplay()
    return 1
}

function removeResource(id) {
    if (id === "" || id === null) {
        return 0
    }

    id = id.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")
    
    if (balance.resources[id] == undefined) {
        alert(`Resource ${id} does not exist!`)
        return 0
    }

    delete balance.resources[id]
    for (let proc of Object.keys(balance.process)) {
        delete balance.process[proc].inputs[id]
        delete balance.process[proc].outputs[id]
    }
    updateDisplay()
    return 1
}

function toggleResource(id) {
    if (id === "" || id === null) {
        return 0
    }

    id = id.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")
    
    if (balance.resources[id] == undefined) {
        alert(`Resource ${id} does not exist!`)
        return 0
    }

    balance.resources[id] = 1 - balance.resources[id]
}

function createProcess(id) {
    let smallest_unused = getGenericProcessName()
    if (id === "" || id === null || id === undefined) {
        id = `${smallest_unused}`
    }

    id = id.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")

    if (balance.process[id] != undefined) {
        alert(`Process ${id} already exists!`)
        return 0
    }
    
    balance.process[id] = {
        inputs: {},
        outputs: {},
        power: 0,
        time: 1,
        allow_overclocking: true,
        perfect_overclock: false
    }
    //balance.process_names.add(smallest_unused)
    updateDisplay()
    return 1
}

function removeProcess(id, noupdate = false) {
    if (id === "" || id === null) {
        return 0
    }

    if (balance.process[id] == undefined) {
        // can't figure out why this is firing more than once so no alerts for you
        //alert(`Process ${id} does not exist!`)
        return 0
    }

    if (!noupdate) {
        if (!confirm(`Are you sure you want to delete process ${id}?`)) {
            return
        }
    }
    delete balance.process[id]
    if (!noupdate) updateDisplay()
    return
}

function setProcessIn(id, obj, value) {
    if (obj === "" || obj === null) return
    obj = obj.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")
    if (balance.resources[obj] === undefined) {
        if (!addResource(obj)) {
            return
        }
    }
    balance.process[id].inputs[obj] = value
    updateDisplay()
}

function setProcessOut(id, obj, value) {
    if (obj === "" || obj === null) return
    obj = obj.replaceAll("'", "_").replaceAll("\\", "_").replaceAll("\"", "_").replaceAll(" ", "_")
    if (balance.resources[obj] === undefined) {
        if (!addResource(obj)) {
            return
        }
    }
    balance.process[id].outputs[obj] = value
    updateDisplay()
}

function removeProcessIn(id, obj) {
    if (obj === "" || obj === null) return
    delete balance.process[id].inputs[obj]
    updateDisplay()
}

function removeProcessOut(id, obj) {
    if (obj === "" || obj === null) return
    delete balance.process[id].outputs[obj]
    updateDisplay()
}

function updateDisplay() {
    let resources_string = `
        <h3>Current Resources</h3>
        <div class="res-grid-wrapper">
    `
    
    let resources = Object.keys(balance.resources)
    for (let res of resources.sort()) {
        resources_string += `${res.replaceAll("_", " ")} <input id="${res}-is-basic" type="checkbox"> <button onclick="removeResource('${res}')">Remove this resource</button> <button onclick="balance.target = '${res}'; updateDisplay();">Set this resource as the target</button>`
    }

    resources_string += "</div>"
    document.getElementById("resource-types").innerHTML = resources_string

    let processes_string = `
        <h3>Processes</h3>
    `

    for (let proc of Object.keys(balance.process)) {
        let inputs_string = `Inputs: <div class="grid-wrapper">`
        let outputs_string = `Outputs: <div class="grid-wrapper">`

        // construct input
        for (let i of Object.keys(balance.process[proc].inputs)) {
            inputs_string += `
                ${i.replaceAll("_", " ")}
                <input type="number" id="${proc}-${i}-amount-input" data-proc="${proc}" data-i="${i}" class="input-item-form" value="${balance.process[proc].inputs[i]}" style="width: 10ch;">
                <button onclick="removeProcessIn('${proc}', '${i}')">Remove this input</button>
            `
        }

        inputs_string += `
            <div id="${proc}-inputs" class="special-wrapper">
                <form id="${proc}-input-add" class="updating-form">
                    <input id="${proc}-input-add-input" type="text" style="width: 12ch">
                    <button type="submit">Add Input</button>
                </form>
            </div>
        `

        inputs_string += "</div>"

        // construct output
        for (let i of Object.keys(balance.process[proc].outputs)) {
            outputs_string += `
                ${i.replaceAll("_", " ")}
                <input type="number" id="${proc}-${i}-amount-output" data-proc="${proc}" data-i="${i}" class="output-item-form" value="${balance.process[proc].outputs[i]}" style="width: 10ch;">
                <button onclick="removeProcessOut('${proc}', '${i}')">Remove this output</button>
            `
        }

        outputs_string += `
            <div id="${proc}-outputs" class="special-wrapper">
                <form id="${proc}-output-add" class="updating-form">
                    <input id="${proc}-output-add-input" type="text" style="width: 12ch">
                    <button type="submit">Add Output</button>
                </form>
            </div>
        `

        outputs_string += "</div>"

        processes_string += `
        <div class="process-wrapper">
            <input class="name-input name-form" value="${proc.replaceAll("_", " ")}" data-proc="${proc}">
            <hr>
            ${inputs_string}
            <hr>
            ${outputs_string}
            <hr>
            Power: <input class="power-input" data-proc="${proc}" type="number" id="${proc}-power" style="width: 16ch" value="${balance.process[proc].power}"><br>
            Time: <input class="time-input" data-proc="${proc}" type="number" id="${proc}-time" style="width: 16ch" value="${balance.process[proc].time}"><br>
            <button onclick="removeProcess('${proc}')">Remove this process</button>
        </div><br>`
    }

    document.getElementById("processes-container").innerHTML = processes_string

    for (let res of resources.sort()) {
        document.getElementById(`${res}-is-basic`).checked = !!balance.resources[res]
        document.getElementById(`${res}-is-basic`).addEventListener("change", () => {
            toggleResource(res)
            document.getElementById(`${res}-is-basic`).checked = !!balance.resources[res]
        })
    }

    for (let proc of Object.keys(balance.process)) {
        document.getElementById(`${proc}-input-add`).addEventListener('submit', (e) => {
            e.preventDefault()

            setProcessIn(proc, document.getElementById(`${proc}-input-add-input`).value, 0)
        })

        document.getElementById(`${proc}-output-add`).addEventListener('submit', (e) => {
            e.preventDefault()

            setProcessOut(proc, document.getElementById(`${proc}-output-add-input`).value, 0)
        })

        document.querySelectorAll(".input-item-form").forEach((x) => {
            x.addEventListener('change', (e) => {
                setProcessIn(x.dataset.proc, x.dataset.i, Number(x.value))
            })
        })

        document.querySelectorAll(".output-item-form").forEach((x) => {
            x.addEventListener('change', (e) => {
                setProcessOut(x.dataset.proc, x.dataset.i, Number(x.value))
            })
        })

        document.querySelectorAll(".name-form").forEach((x) => {
            x.addEventListener('change', (e) => {
                balance.process[x.value] = JSON.parse(JSON.stringify(balance.process[x.dataset.proc]))
                removeProcess(x.dataset.proc, true)
                updateDisplay()
            })
        })

        document.querySelectorAll(".power-input").forEach((x) => {
            x.addEventListener('change', (e) => {
                balance.process[x.dataset.proc].power = Number(x.value)
            })
        })

        document.querySelectorAll(".time-input").forEach((x) => {
            x.addEventListener('change', (e) => {
                balance.process[x.dataset.proc].time = Number(x.value)
            })
        })
    }

    document.getElementById("solve-update-item").innerHTML = (balance.target ?? "").replaceAll("_", " ")
    save(balance)
}

let global_results = null
function updateResults() {
    if (global_results == null) return

    let resources = Object.keys(balance.resources)
    let results_grid_element = `<div class="general-grid" style="--cols: ${resources.length + 2}">`
    
    // Draw top row
    results_grid_element += `<span></span>`
    for (let res of resources) {
        if (res == balance.target) {results_grid_element += `<span class="target">${res.replaceAll("_", " ")}</span>`}
        else {
            if (balance.resources[res] == 0) {results_grid_element += `<span class="input-mat">${res.replaceAll("_", " ")}</span>`}
            else {results_grid_element += `<span>${res.replaceAll("_", " ")}</span>`}
        }
    }
    results_grid_element += `<span class="power">${global_results.type == 1 ? "Machines" : "Power"}</span>`

    let running_index = 0
    let resource_net = {}
    for (let proc of Object.keys(balance.process)) {
        results_grid_element += `<span>${proc} <br>x ${global_results.machines[running_index]}</span>`
        for (let res of resources) {
            let val = ((balance.process[proc].outputs?.[res] ?? 0) - (balance.process[proc].inputs[res] ?? 0)) * global_results.machines[running_index] / balance.process[proc].time
            if (Number.isNaN(val)) {
                val = 0
            }
            if (res == balance.target) {results_grid_element += `<span class="target values ${val == 0 ? "" : (val > 0 ? "positive" : "negative")}">${val}/s</span>`}
            else {
                if (balance.resources[res] == 0) {results_grid_element += `<span class="input-mat values ${val == 0 ? "" : (val > 0 ? "positive" : "negative")}">${val}/s</span>`}
                else {results_grid_element += `<span class="values ${val == 0 ? "" : (val > 0 ? "positive" : "negative")}">${val}/s</span>`}
            }

            resource_net[res] = (resource_net?.[res] ?? 0) + val
        }
        results_grid_element += `<span class="power values">${(global_results.type == 1 ? 1 : balance.process[proc].power) * global_results.machines[running_index] / (global_results.type != 2 ? 1 : balance.process[proc].time)}${global_results.type == 2 ? "/s" : ""}</span>`
        running_index += 1
    }

    // Draw bottom row
    results_grid_element += `<span class="bottom-row values">Total Values</span>`
    for (let res of resources) {
        if (res == balance.target) {results_grid_element += `<span class="bottom-row target values ${resource_net[res] == 0 ? "" : (resource_net[res] > 0 ? "positive" : "negative")}">${resource_net[res]}/s</span>`}
        else {
            if (balance.resources[res] == 0) {results_grid_element += `<span class="bottom-row input-mat values ${resource_net[res] == 0 ? "" : (resource_net[res] > 0 ? "positive" : "negative")}">${resource_net[res]}/s</span>`}
            else {results_grid_element += `<span class="bottom-row values ${resource_net[res] == 0 ? "" : (resource_net[res] > 0 ? "positive" : "negative")}">${resource_net[res]}/s</span>`}
        }
    }
    results_grid_element += `<span class="bottom-row values power">${global_results.cost}${global_results.type == 2 ? "/s" : ""}</span>`
                    
    results_grid_element += `</div>`
    document.getElementById("grid").innerHTML = results_grid_element
}

function load_preset(i) {
    if (i > PRESETS.length) {
        return
    }

    balance = JSON.parse(PRESETS[i])
    updateDisplay()
}

function save(p = null) {
    localStorage.setItem("gtpc-recipe", JSON.stringify(p))
}

function load() {
    let loaded_save = localStorage.getItem("gtpc-recipe")
    if (loaded_save === null || JSON.parse(loaded_save) === null) return
    balance = JSON.parse(loaded_save)

    updateDisplay()
}

load()