class Matrix {
    constructor(x, y) {
        this.val = []
        this.x = x
        this.y = y
        for (let i = 0; i < x; i++) {
            this.val.push(Array(y).fill(0))
        }
    }

    get(x, y) {
        return this.val[x % this.x][y % this.y]
    }

    get_row(x) {
        return this.val[x % this.x]
    }

    set(x, y, val) {
        this.val[x % this.x][y % this.y] = val
    }

    set_row(x, v) {
        this.val[x % this.x] = [...v] // JS shallow copying
    }

    scale_row(x, s) {
        for (let i = 0; i < this.y; i++) {
            this.set(x, i, this.get(x, i) * s)
        }
    }

    sub_from(source_row, dest_row) {
        // dest_row is modified, source_row is not!!
        for (let i = 0; i < this.y; i++) {
            this.set(dest_row, i, this.get(dest_row, i) - this.get(source_row, i))
        }
    }

    zero_in_col(source_row, dest_row, zeroed_col) {
        let scale = this.get(dest_row, zeroed_col) / this.get(source_row, zeroed_col) 
        if (Math.abs(this.get(source_row, zeroed_col)) < eps) {
            console.warn("Tried to zero from a (nearly) zeroed source col (will blow up)")
            return
        }
        for (let i = 0; i < this.y; i++) {
            this.set(dest_row, i, this.get(dest_row, i) - this.get(source_row, i) * scale)
        }
    }

    clone() {
        let cl = new Matrix(this.x, this.y)
        for (let i = 0; i < this.x; i++) {
            cl.set_row(i, this.val[i])
        }
        return cl
    }
}

//   y 0 1 2 ...
// x 
// 0   p p p
// 1   p p p
// 2   p p p
// ...

/*
Planning (I will explode if I don't write this down so I can follow it)

The matrix has rows:
- one per resource PER SECOND (r1, r2, ...)
- one target resource (T)
- power PER SECOND (power), the target
The matrix has columns:
- one per process (p1, p2, ...)
- in the future: one per overclock modus?

As a linear programming problem, we need to:
for power:
Minimize sum(power_i * machine_i), subject to:
- p1, p2, ... >= 0 (no negative machines)
- r1, r2, ... >= 0 (no negative intermediates, which would cause machine waitings)
- T >= some_amount (given by user)

for power/s:
Minimize sum(power_i * machine_i / time_i), subject to:
- p1, p2, ... >= 0 (no negative machines)
- r1, r2, ... >= 0 (no negative intermediates, which would cause machine waitings)
- T >= some_amount (given by user)

for machines:
Minimize sum(machine_i), subject to:
- p1, p2, ... >= 0 (no negative machines)
- r1, r2, ... >= 0 (no negative intermediates, which would cause machine waitings)
- T >= some_amount (given by user)

for custom: add an extra user-inputted cost row? 
*/

let eps = 1e-9

function cost(balance, arr) {
    if (arr.length != Object.keys(balance.process).length) {
        console.error("invalid cost length")
        return NaN
    }
    let running = 0
    let index = 0
    for (let proc of Object.keys(balance.process)) {
        running += balance.process[proc].power * arr[index]
        index += 1
    }
    return running
}

// This function has like 50 comments because this is impossible to wrap my head around
function simplex(mat, target_col, target_prod, cost_arr, proc_cols = cost_arr.length, slack_cols = cost_arr.length - proc_cols) {
    let tableau = new Matrix( // dammit french
        slack_cols + 1,
        proc_cols + slack_cols + 1 // Extra column for constant for the target item
    ) 

    // Populate tableau
    for (let i = 0; i < slack_cols; i++) {
        for (let j = 0; j < proc_cols; j++) {
            tableau.set(i, j, mat.get(i, j))
        }
        for (let j = proc_cols; j < proc_cols + slack_cols; j++) { // Slack variables
            tableau.set(i, j, (j - proc_cols == i) ? -1 : 0)
        }
        tableau.set(i, proc_cols + slack_cols, i == target_col ? -target_prod : 0)
    }

    tableau.set_row(tableau.x - 1, cost_arr)
    tableau.val[slack_cols].push(0)

    // Find first feasible solution

    let aux_tab = new Matrix(
        slack_cols + 1,
        slack_cols * 2 + proc_cols + 1
    )

    for (let i = 0; i < slack_cols; i++) {
        for (let j = 0; j < proc_cols; j++) { // Basic array
            aux_tab.set(i, j, tableau.get(i, j))
        }
        for (let j = proc_cols; j < proc_cols + slack_cols; j++) { // Slack variables
            aux_tab.set(i, j, (j - proc_cols == i) ? -1 : 0)
        }
        for (let j = proc_cols + slack_cols; j < slack_cols * 2 + proc_cols; j++) { // Artificial variables
            aux_tab.set(i, j, (j - proc_cols - slack_cols == i) ? 1 : 0)
        }
        aux_tab.set(i, slack_cols * 2 + proc_cols, -tableau.get(i, proc_cols + slack_cols) + 0)
    }
    
    let miss_array = []
    for (let i = 0; i < slack_cols * 2 + proc_cols + 1; i++) {
        let running_count = ((slack_cols + proc_cols <= i) && (i != slack_cols * 2 + proc_cols) ? 1 : 0)
        for (let j = 0; j < slack_cols + 1; j++) {
            running_count -= aux_tab.get(j, i)
        }
        miss_array.push(running_count)
    }
    aux_tab.set_row(slack_cols, miss_array)

    console.log(mat)
    console.log(tableau)
    console.log(aux_tab)

    // Compute and optimize secondary feasible solution

    // Construct basic variable
    let basic = []
    for (let i = 0; i < slack_cols; i++) basic.push(proc_cols + slack_cols + i)

    while (true) {
        let pivot = null
        for (let i = 0; i < slack_cols * 2 + proc_cols; i++) {
            if (aux_tab.get(slack_cols, i) < -eps) { // floating point issues can occur (I hope they won't, but they can) in the solve algorithm.
                pivot = i
                break
            }
        }

        if (pivot == null) {
            // We have found some sort of optimal solution.
            break
        }

        // Compute ratios
        // Bland's rule prevents cycling even though it is very slow. 
        // The practical input sizes should make the time taken irrelevant however, so I used it here
        let ratio = Infinity
        let exiting_row = -1
        for (let row = 0; row < aux_tab.x; row++) {
            if (aux_tab.get(row, pivot) > eps) { // floating point
                let r = aux_tab.get(row, aux_tab.y - 1) / aux_tab.get(row, pivot)
                if (ratio > r) {
                    ratio = r
                    exiting_row = row
                    console.log("Found row", row, "with ratio", r)
                }
            }
        }

        if (ratio == Infinity) {
            // The problem is unbounded.
            return Infinity
        }

        // Rescale chosen exiting row.
        let scale = aux_tab.get(exiting_row, pivot)
        console.log("scaling by", scale, "in column", pivot)
        aux_tab.scale_row(exiting_row, 1 / scale)

        // Normalize all other rows.
        for (let row = 0; row < aux_tab.x; row++) {
            if (row != exiting_row) {
                aux_tab.zero_in_col(exiting_row, row, pivot)
            }
        }

        // Update basis
        basic[exiting_row] = pivot

        console.log(aux_tab)
    }

    // If the solution vector is not zero for all artificial variable, the system is unsolvable without cheating.
    if (Math.abs(aux_tab.get(aux_tab.x - 1, aux_tab.y - 1)) > eps) {
        return null
    }

    for (let i = 0; i < slack_cols; i++) {
        for (let j = 0; j < proc_cols + slack_cols; j++) {
            tableau.set(i, j, aux_tab.get(i, j))
        }
        tableau.set(i, proc_cols + slack_cols, aux_tab.get(i, slack_cols * 2 + proc_cols))
    }

    // Recompute cost entries.
    for (let i = 0; i < basic.length; i++) {
        tableau.zero_in_col(i, tableau.x - 1, basic[i])
    }

    // Solve secondary
    console.log("phase 2")
    console.log(tableau)
    while (true) {
        let pivot = null
        for (let i = 0; i < slack_cols + proc_cols; i++) {
            if (tableau.get(slack_cols, i) < -eps) {
                pivot = i
                break
            }
        }

        if (pivot == null) {
            // We have found some sort of optimal solution.
            break
        }

        let ratio = Infinity
        let exiting_row = -1
        for (let row = 0; row < tableau.x; row++) {
            if (tableau.get(row, pivot) > eps) { // floating point
                let r = tableau.get(row, tableau.y - 1) / tableau.get(row, pivot)
                if (ratio > r) {
                    ratio = r
                    exiting_row = row
                    console.log("Found row", row, "with ratio", r)
                }
            }
        }

        if (ratio == Infinity) {
            // The problem is unbounded.
            return Infinity
        }

        // Rescale chosen exiting row.
        let scale = tableau.get(exiting_row, pivot)
        //console.log("scaling by", scale, "in column", pivot)
        tableau.scale_row(exiting_row, 1 / scale)

        // Normalize all other rows.
        for (let row = 0; row < tableau.x; row++) {
            if (row != exiting_row) {
                tableau.zero_in_col(exiting_row, row, pivot)
            }
        }

        // Update basis
        basic[exiting_row] = pivot

        console.log(tableau)
    }

    let mcount = Array(proc_cols).fill(0)
    for (let i = 0; i < basic.length; i++) {
        if (basic[i] < proc_cols) {
            mcount[basic[i]] = tableau.get(i, tableau.y - 1)
        }
    }

    console.log({
        machines: mcount,
        cost: -tableau.get(tableau.x - 1, tableau.y - 1)
    })

    return {
        machines: mcount,
        cost: -tableau.get(tableau.x - 1, tableau.y - 1)
    }
}

function solve(solve_type, balance, target, amount) {
    let resource_count = Object.keys(balance.resources).length
    let process_count = Object.keys(balance.process).length

    if (balance.resources[target] === undefined) {
        console.error("Invalid solve, target does not exist")
        return null
    }

    let embed = {}
    let running_index = 0
    for (let res of Object.keys(balance.resources)) {
        if (balance.resources[res] == 1) {
            // intermediate resource, >= 0
            embed[res] = running_index
            running_index += 1
        } else {} // allowed import resource
    }

    let mat = new Matrix(
        running_index, 
        process_count + running_index // Each process, plus each slack 
    )
    
    // Populate the matrix

    let current_processed_column = 0
    let cost_arr = []

    for (let proc of Object.keys(balance.process)) {
        for (let i of Object.keys(balance.process[proc].inputs)) {
            if (embed[i] != undefined) {
                mat.set(embed[i], current_processed_column, -balance.process[proc].inputs[i] / balance.process[proc].time)
            }
        }

        for (let i of Object.keys(balance.process[proc].outputs)) {
            if (embed[i] != undefined) {
                mat.set(embed[i], current_processed_column, balance.process[proc].outputs[i] / balance.process[proc].time)
            }
        }

        switch (solve_type) {
            case 1:
                cost_arr.push(1)
                break
            case 2:
                cost_arr.push(balance.process[proc].power / balance.process[proc].time)
        }
        current_processed_column += 1
    }

    console.log(cost_arr)

    let size_cols = cost_arr.length

    // Populate slack columns

    for (let proc of Object.keys(embed)) {
        mat.set(embed[proc], current_processed_column + embed[proc], -1) // <something> - s = 0 means that <something> >= 0
        cost_arr.push(0)
    }

    // Solve

    let solution = simplex(mat, embed[target], amount, [...cost_arr], size_cols)

    if (solution == Infinity) {
        console.error("Unbounded solution!")
        return Infinity
    }
    
    if (solution == null) {
        console.error("No solution found!")
        return null
    }

    let index = 0
    for (let proc of Object.keys(balance.process)) {
        console.log(`${proc} = ${solution.machines[index]}`)
        index += 1
    }

    solution.type = solve_type
    return solution
}