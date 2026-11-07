let balance = {
    resources: {

    },
    process: {

    },

    process_names: new Set()
}

document.getElementById("add-resource").addEventListener('submit', (e) => {
    e.preventDefault()

    addResource(document.getElementById('add-resource-input').value)
})

document.getElementById("remove-resource").addEventListener('submit', (e) => {
    e.preventDefault()

    removeResource(document.getElementById('remove-resource-input').value)
})

document.getElementById("add-process").addEventListener('submit', (e) => {
    e.preventDefault()

    createProcess(document.getElementById('add-process-input')?.value)
})

function getGenericProcessName() {
    let least_unused = 0
    while (balance.process_names.has(least_unused)) least_unused += 1
    return least_unused
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

function createProcess(id) {
    let smallest_unused = getGenericProcessName()
    if (id === "" || id === null) {
        id = `Process${smallest_unused}`
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
    balance.process_names.add(smallest_unused)
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
        <ul>
    `
    
    let resources = Object.keys(balance.resources)
    for (let res of resources.sort()) {
        resources_string += `<li>${res.replaceAll("_", " ")} <button onclick="removeResource('${res}')">Remove this resource</button></li>`
    }

    resources_string += "</ul>"
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
                <button onclick="removeProcessOut("${proc}", "${i}")">Remove this output</button>
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
                balance.process[x.value] = balance.process[x.dataset.proc]
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
}