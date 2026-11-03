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
        return
    }
    
    if (balance.resources[id] != undefined) {
        alert(`Resource ${id} is already defined!`)
        return
    }

    balance.resources[id] = 1
    updateDisplay()
}

function removeResource(id) {
    if (id === "" || id === null) {
        return
    }
    
    if (balance.resources[id] == undefined) {
        alert(`Resource ${id} does not exist!`)
        return
    }

    delete balance.resources[id]
    updateDisplay()
}

function createProcess(id) {
    let smallest_unused = getGenericProcessName()
    if (id === "" || id === null) {
        id = `Process #${smallest_unused}`
    }

    if (balance.process[id] != undefined) {
        alert(`Process ${id} already exists!`)
        return
    }
    
    balance.process[id] = {
        inputs: [],
        outputs: [],
        power: 0,
        time: 1
    }
    console.log(smallest_unused)
    balance.process_names.add(smallest_unused)
    updateDisplay()
}

function updateDisplay() {
    let resources_string = `
        <h3>Current Resources</h3>
        <ul>
    `
    
    for (let res of Object.keys(balance.resources)) {
        resources_string += `<li>${res}</li>`
    }

    resources_string += "</ul>"
    document.getElementById("resource-types").innerHTML = resources_string

    let processes_string = `
        <h3>Processes</h3>
    `
    for (let proc of Object.keys(balance.process)) {
        processes_string += `<div class=process-wrapper><h5>${proc}</h5></div><br>`
    }
    document.getElementById("processes").innerHTML = processes_string
}