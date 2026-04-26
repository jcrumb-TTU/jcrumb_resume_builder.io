// ============================================================
// CONSTANTS
// ============================================================
const strBaseUrl = 'http://localhost:3000'

let strEditingJobID = ''
let strEditingSkillID = ''
let strEditingAwardID = ''
let strEditingCertificationID = ''

// ============================================================
// NAVIGATION
// ============================================================
const showSection = (strSectionID) => {
    const arrSections = [
        '#divDashboard',
        '#divJobs',
        '#divSkills',
        '#divAwards',
        '#divCertifications',
        '#divResumeBuilder'
    ]

    arrSections.forEach((strSection) => {
        document.querySelector(strSection).classList.add('d-none')
    })

    document.querySelector(strSectionID).classList.remove('d-none')
}

// ============================================================
// NAVBAR EVENT LISTENERS
// ============================================================
document.querySelector('#btnNavDashboard').addEventListener('click', async () => {
    showSection('#divDashboard')
    await loadDashboard()
})

document.querySelector('#btnNavJobs').addEventListener('click', async () => {
    showSection('#divJobs')
    await loadJobs()
})

document.querySelector('#btnNavSkills').addEventListener('click', async () => {
    showSection('#divSkills')
    await loadSkills()
})

document.querySelector('#btnNavAwards').addEventListener('click', async () => {
    showSection('#divAwards')
    await loadAwards()
})

document.querySelector('#btnNavCertifications').addEventListener('click', async () => {
    showSection('#divCertifications')
    await loadCertifications()
})

document.querySelector('#btnNavResumeBuilder').addEventListener('click', async () => {
    showSection('#divResumeBuilder')
    await loadResumeBuilder()
})

// ============================================================
// SECTION: Dashboard
// ============================================================
const loadDashboard = async () => {
    try {
        const [objJobs, objSkills, objAwards, objCerts] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`)
        ])

        if(objJobs.ok == false || objSkills.ok == false || objAwards.ok == false || objCerts.ok == false){
            throw new Error('Failed to load dashboard data')
        }

        const arrJobs = await objJobs.json()
        const arrSkills = await objSkills.json()
        const arrAwards = await objAwards.json()
        const arrCerts = await objCerts.json()

        document.querySelector('#pJobCount').innerText = arrJobs.length
        document.querySelector('#pSkillCount').innerText = arrSkills.length
        document.querySelector('#pAwardCount').innerText = arrAwards.length
        document.querySelector('#pCertCount').innerText = arrCerts.length
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load dashboard data",
            icon: "error"
        })
    }
}

// ============================================================
// SECTION: Jobs
// ============================================================
const resetJobForm = () => {
    document.querySelector('#txtRoleName').value = ''
    document.querySelector('#txtCompanyName').value = ''
    document.querySelector('#txtStartDate').value = ''
    document.querySelector('#txtEndDate').value = ''
    document.querySelector('#btnSaveJob').innerText = 'Save Job'
    document.querySelector('#btnCancelEditJob').classList.add('d-none')
    strEditingJobID = ''
}

const loadJobs = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/jobs`)

        if(objResponse.ok == false){
            throw new Error('Failed to load jobs')
        }

        const arrJobs = await objResponse.json()

        document.querySelector('#divJobsList').innerHTML = ''

        if(arrJobs.length < 1){
            document.querySelector('#divJobsList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No jobs saved yet.</p>
                    </div>
                </div>`
        }

        arrJobs.forEach((objJob) => {
            let strResponsibilitiesHtml = ''

            objJob.arrResponsibilities.forEach((objResponsibility) => {
                strResponsibilitiesHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <span class="me-3">${objResponsibility.strDescription}</span>
                        <button
                            class="btn btn-outline-danger btn-sm"
                            type="button"
                            id="btnDeleteResponsibility_${objResponsibility.strResponsibilityID}"
                            aria-label="Delete responsibility">
                            Delete
                        </button>
                    </li>`
            })

            document.querySelector('#divJobsList').innerHTML += `
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                            <div>
                                <h3 class="h5 mb-1">${objJob.strRoleName}</h3>
                                <p class="mb-1">${objJob.strCompanyName}</p>
                                <p class="text-muted mb-0">${objJob.strStartDate} - ${objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'}</p>
                            </div>
                            <div>
                                <button
                                    class="btn btn-primary btn-sm me-2"
                                    type="button"
                                    id="btnEdit_${objJob.strJobID}"
                                    aria-label="Edit ${objJob.strRoleName}">
                                    Edit
                                </button>
                                <button
                                    class="btn btn-danger btn-sm"
                                    type="button"
                                    id="btnDelete_${objJob.strJobID}"
                                    aria-label="Delete ${objJob.strRoleName}">
                                    Delete
                                </button>
                            </div>
                        </div>

                        <hr>

                        <h4 class="h6">Responsibilities</h4>
                        <div class="row g-2 mb-3">
                            <div class="col-md-9">
                                <input
                                    class="form-control"
                                    id="txtResponsibility_${objJob.strJobID}"
                                    type="text"
                                    placeholder="Add a responsibility bullet"
                                    aria-label="Responsibility for ${objJob.strRoleName}">
                            </div>
                            <div class="col-md-3">
                                <button
                                    class="btn btn-success w-100"
                                    type="button"
                                    id="btnAddResponsibility_${objJob.strJobID}"
                                    aria-label="Add responsibility to ${objJob.strRoleName}">
                                    Add Responsibility
                                </button>
                            </div>
                        </div>
                        <ul class="list-group">
                            ${strResponsibilitiesHtml.length > 0 ? strResponsibilitiesHtml : '<li class="list-group-item text-muted">No responsibilities saved yet.</li>'}
                        </ul>
                    </div>
                </div>`
        })

        await loadDashboard()
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load jobs",
            icon: "error"
        })
    }
}

document.querySelector('#btnSaveJob').addEventListener('click', async () => {
    const strRoleName = document.querySelector('#txtRoleName').value.trim()
    const strCompanyName = document.querySelector('#txtCompanyName').value.trim()
    const strStartDate = document.querySelector('#txtStartDate').value.trim()
    const strEndDate = document.querySelector('#txtEndDate').value.trim()

    let blnError = false
    let strMessage = ''

    if(strRoleName.length < 1){
        blnError = true
        strMessage += 'You must provide a role name. '
    }
    if(strCompanyName.length < 1){
        blnError = true
        strMessage += 'You must provide a company name. '
    }
    if(strStartDate.length < 1){
        blnError = true
        strMessage += 'You must provide a start date. '
    }

    if(blnError == false){
        try {
            const strMethod = strEditingJobID.length > 0 ? 'PUT' : 'POST'
            const objPayload = strEditingJobID.length > 0
                ? {strJobID: strEditingJobID, strRoleName, strCompanyName, strStartDate, strEndDate}
                : {strRoleName, strCompanyName, strStartDate, strEndDate}

            const objResponse = await fetch(`${strBaseUrl}/api/jobs`, {
                method: strMethod,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: strEditingJobID.length > 0 ? "Job updated successfully" : "Job saved successfully",
                    icon: "success",
                    timer: 1500
                })
                resetJobForm()
                await loadJobs()
            } else {
                const objErrorData = await objResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || objResponse.status)
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage.trim(),
            icon: "error"
        })
    }
})

document.querySelector('#btnCancelEditJob').addEventListener('click', async () => {
    resetJobForm()
    await loadJobs()
})

// ============================================================
// SECTION: Responsibilities
// ============================================================
document.querySelector('#divJobsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDelete_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEdit_"]')
    const objAddResponsibilityBtn = objEvent.target.closest('[id^="btnAddResponsibility_"]')
    const objDeleteResponsibilityBtn = objEvent.target.closest('[id^="btnDeleteResponsibility_"]')

    if(objDeleteBtn){
        const strJobID = objDeleteBtn.id.replace('btnDelete_', '')

        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This job and all its responsibilities will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/jobs/${strJobID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Job deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    resetJobForm()
                    await loadJobs()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete job')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        }
    }

    if(objEditBtn){
        const strJobID = objEditBtn.id.replace('btnEdit_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/jobs`)

            if(objResponse.ok == false){
                throw new Error('Failed to load job for editing')
            }

            const arrJobs = await objResponse.json()
            const objJob = arrJobs.find((objCurrentJob) => objCurrentJob.strJobID === strJobID)

            if(objJob){
                strEditingJobID = objJob.strJobID
                document.querySelector('#txtRoleName').value = objJob.strRoleName
                document.querySelector('#txtCompanyName').value = objJob.strCompanyName
                document.querySelector('#txtStartDate').value = objJob.strStartDate
                document.querySelector('#txtEndDate').value = objJob.strEndDate
                document.querySelector('#btnSaveJob').innerText = 'Update Job'
                document.querySelector('#btnCancelEditJob').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    }

    if(objAddResponsibilityBtn){
        const strJobID = objAddResponsibilityBtn.id.replace('btnAddResponsibility_', '')
        const strDescription = document.querySelector(`#txtResponsibility_${strJobID}`).value.trim()

        let blnError = false
        let strMessage = ''

        if(strDescription.length < 1){
            blnError = true
            strMessage += 'You must provide a responsibility description.'
        }

        if(blnError == false){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/responsibilities`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({strJobID, strDescription})
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Saved",
                        text: "Responsibility saved successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadJobs()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to save responsibility')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        } else {
            Swal.fire({
                title: "Validation Error",
                text: strMessage,
                icon: "error"
            })
        }
    }

    if(objDeleteResponsibilityBtn){
        const strResponsibilityID = objDeleteResponsibilityBtn.id.replace('btnDeleteResponsibility_', '')

        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This responsibility will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/responsibilities/${strResponsibilityID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Responsibility deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadJobs()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete responsibility')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        }
    }
})

// ============================================================
// SECTION: Skills
// ============================================================
const resetSkillForm = () => {
    document.querySelector('#txtSkillName').value = ''
    document.querySelector('#txtProficiencyLevel').value = ''
    document.querySelector('#btnSaveSkill').innerText = 'Save Skill'
    document.querySelector('#btnCancelEditSkill').classList.add('d-none')
    strEditingSkillID = ''
}

const loadSkills = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/skills`)

        if(objResponse.ok == false){
            throw new Error('Failed to load skills')
        }

        const arrSkills = await objResponse.json()
        document.querySelector('#divSkillsList').innerHTML = ''

        if(arrSkills.length < 1){
            document.querySelector('#divSkillsList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No skills saved yet.</p>
                    </div>
                </div>`
        }

        arrSkills.forEach((objSkill) => {
            document.querySelector('#divSkillsList').innerHTML += `
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div>
                            <p class="fw-bold mb-1">${objSkill.strSkillName}</p>
                            <p class="mb-0 text-muted">${objSkill.strProficiencyLevel.length > 0 ? objSkill.strProficiencyLevel : 'No proficiency level provided'}</p>
                        </div>
                        <div>
                            <button
                                class="btn btn-primary btn-sm me-2"
                                type="button"
                                id="btnEditSkill_${objSkill.strSkillID}"
                                aria-label="Edit ${objSkill.strSkillName}">
                                Edit
                            </button>
                            <button
                                class="btn btn-danger btn-sm"
                                type="button"
                                id="btnDeleteSkill_${objSkill.strSkillID}"
                                aria-label="Delete ${objSkill.strSkillName}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>`
        })

        await loadDashboard()
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load skills",
            icon: "error"
        })
    }
}

document.querySelector('#btnSaveSkill').addEventListener('click', async () => {
    const strSkillName = document.querySelector('#txtSkillName').value.trim()
    const strProficiencyLevel = document.querySelector('#txtProficiencyLevel').value.trim()

    let blnError = false
    let strMessage = ''

    if(strSkillName.length < 1){
        blnError = true
        strMessage += 'You must provide a skill name.'
    }

    if(blnError == false){
        try {
            const strMethod = strEditingSkillID.length > 0 ? 'PUT' : 'POST'
            const objPayload = strEditingSkillID.length > 0
                ? {strSkillID: strEditingSkillID, strSkillName, strProficiencyLevel}
                : {strSkillName, strProficiencyLevel}

            const objResponse = await fetch(`${strBaseUrl}/api/skills`, {
                method: strMethod,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: strEditingSkillID.length > 0 ? "Skill updated successfully" : "Skill saved successfully",
                    icon: "success",
                    timer: 1500
                })
                resetSkillForm()
                await loadSkills()
            } else {
                const objErrorData = await objResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || objResponse.status)
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

document.querySelector('#btnCancelEditSkill').addEventListener('click', async () => {
    resetSkillForm()
    await loadSkills()
})

document.querySelector('#divSkillsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteSkill_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditSkill_"]')

    if(objDeleteBtn){
        const strSkillID = objDeleteBtn.id.replace('btnDeleteSkill_', '')

        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This skill will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/skills/${strSkillID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Skill deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadSkills()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete skill')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        }
    }

    if(objEditBtn){
        const strSkillID = objEditBtn.id.replace('btnEditSkill_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/skills`)

            if(objResponse.ok == false){
                throw new Error('Failed to load skill for editing')
            }

            const arrSkills = await objResponse.json()
            const objSkill = arrSkills.find((objCurrentSkill) => objCurrentSkill.strSkillID === strSkillID)

            if(objSkill){
                strEditingSkillID = objSkill.strSkillID
                document.querySelector('#txtSkillName').value = objSkill.strSkillName
                document.querySelector('#txtProficiencyLevel').value = objSkill.strProficiencyLevel
                document.querySelector('#btnSaveSkill').innerText = 'Update Skill'
                document.querySelector('#btnCancelEditSkill').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    }
})

// ============================================================
// SECTION: Awards
// ============================================================
const resetAwardForm = () => {
    document.querySelector('#txtAwardName').value = ''
    document.querySelector('#txtAwardDate').value = ''
    document.querySelector('#txtAwardDescription').value = ''
    document.querySelector('#btnSaveAward').innerText = 'Save Award'
    document.querySelector('#btnCancelEditAward').classList.add('d-none')
    strEditingAwardID = ''
}

const loadAwards = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/awards`)

        if(objResponse.ok == false){
            throw new Error('Failed to load awards')
        }

        const arrAwards = await objResponse.json()
        document.querySelector('#divAwardsList').innerHTML = ''

        if(arrAwards.length < 1){
            document.querySelector('#divAwardsList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No awards saved yet.</p>
                    </div>
                </div>`
        }

        arrAwards.forEach((objAward) => {
            document.querySelector('#divAwardsList').innerHTML += `
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div>
                            <p class="fw-bold mb-1">${objAward.strAwardName}</p>
                            <p class="mb-1 text-muted">${objAward.strAwardDate.length > 0 ? objAward.strAwardDate : 'No award date provided'}</p>
                            <p class="mb-0">${objAward.strDescription.length > 0 ? objAward.strDescription : 'No description provided'}</p>
                        </div>
                        <div>
                            <button
                                class="btn btn-primary btn-sm me-2"
                                type="button"
                                id="btnEditAward_${objAward.strAwardID}"
                                aria-label="Edit ${objAward.strAwardName}">
                                Edit
                            </button>
                            <button
                                class="btn btn-danger btn-sm"
                                type="button"
                                id="btnDeleteAward_${objAward.strAwardID}"
                                aria-label="Delete ${objAward.strAwardName}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>`
        })

        await loadDashboard()
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load awards",
            icon: "error"
        })
    }
}

document.querySelector('#btnSaveAward').addEventListener('click', async () => {
    const strAwardName = document.querySelector('#txtAwardName').value.trim()
    const strAwardDate = document.querySelector('#txtAwardDate').value.trim()
    const strDescription = document.querySelector('#txtAwardDescription').value.trim()

    let blnError = false
    let strMessage = ''

    if(strAwardName.length < 1){
        blnError = true
        strMessage += 'You must provide an award name.'
    }

    if(blnError == false){
        try {
            const strMethod = strEditingAwardID.length > 0 ? 'PUT' : 'POST'
            const objPayload = strEditingAwardID.length > 0
                ? {strAwardID: strEditingAwardID, strAwardName, strAwardDate, strDescription}
                : {strAwardName, strAwardDate, strDescription}

            const objResponse = await fetch(`${strBaseUrl}/api/awards`, {
                method: strMethod,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: strEditingAwardID.length > 0 ? "Award updated successfully" : "Award saved successfully",
                    icon: "success",
                    timer: 1500
                })
                resetAwardForm()
                await loadAwards()
            } else {
                const objErrorData = await objResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || objResponse.status)
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

document.querySelector('#btnCancelEditAward').addEventListener('click', async () => {
    resetAwardForm()
    await loadAwards()
})

document.querySelector('#divAwardsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteAward_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditAward_"]')

    if(objDeleteBtn){
        const strAwardID = objDeleteBtn.id.replace('btnDeleteAward_', '')

        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This award will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/awards/${strAwardID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Award deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadAwards()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete award')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        }
    }

    if(objEditBtn){
        const strAwardID = objEditBtn.id.replace('btnEditAward_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/awards`)

            if(objResponse.ok == false){
                throw new Error('Failed to load award for editing')
            }

            const arrAwards = await objResponse.json()
            const objAward = arrAwards.find((objCurrentAward) => objCurrentAward.strAwardID === strAwardID)

            if(objAward){
                strEditingAwardID = objAward.strAwardID
                document.querySelector('#txtAwardName').value = objAward.strAwardName
                document.querySelector('#txtAwardDate').value = objAward.strAwardDate
                document.querySelector('#txtAwardDescription').value = objAward.strDescription
                document.querySelector('#btnSaveAward').innerText = 'Update Award'
                document.querySelector('#btnCancelEditAward').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    }
})

// ============================================================
// SECTION: Certifications
// ============================================================
const resetCertificationForm = () => {
    document.querySelector('#txtCertificationName').value = ''
    document.querySelector('#txtIssuingOrganization').value = ''
    document.querySelector('#txtDateEarned').value = ''
    document.querySelector('#btnSaveCertification').innerText = 'Save Certification'
    document.querySelector('#btnCancelEditCertification').classList.add('d-none')
    strEditingCertificationID = ''
}

const loadCertifications = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/certifications`)

        if(objResponse.ok == false){
            throw new Error('Failed to load certifications')
        }

        const arrCertifications = await objResponse.json()
        document.querySelector('#divCertificationsList').innerHTML = ''

        if(arrCertifications.length < 1){
            document.querySelector('#divCertificationsList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No certifications saved yet.</p>
                    </div>
                </div>`
        }

        arrCertifications.forEach((objCertification) => {
            document.querySelector('#divCertificationsList').innerHTML += `
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div>
                            <p class="fw-bold mb-1">${objCertification.strCertificationName}</p>
                            <p class="mb-1">${objCertification.strIssuingOrganization}</p>
                            <p class="mb-0 text-muted">${objCertification.strDateEarned.length > 0 ? objCertification.strDateEarned : 'No date earned provided'}</p>
                        </div>
                        <div>
                            <button
                                class="btn btn-primary btn-sm me-2"
                                type="button"
                                id="btnEditCertification_${objCertification.strCertificationID}"
                                aria-label="Edit ${objCertification.strCertificationName}">
                                Edit
                            </button>
                            <button
                                class="btn btn-danger btn-sm"
                                type="button"
                                id="btnDeleteCertification_${objCertification.strCertificationID}"
                                aria-label="Delete ${objCertification.strCertificationName}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>`
        })

        await loadDashboard()
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load certifications",
            icon: "error"
        })
    }
}

document.querySelector('#btnSaveCertification').addEventListener('click', async () => {
    const strCertificationName = document.querySelector('#txtCertificationName').value.trim()
    const strIssuingOrganization = document.querySelector('#txtIssuingOrganization').value.trim()
    const strDateEarned = document.querySelector('#txtDateEarned').value.trim()

    let blnError = false
    let strMessage = ''

    if(strCertificationName.length < 1){
        blnError = true
        strMessage += 'You must provide a certification name. '
    }
    if(strIssuingOrganization.length < 1){
        blnError = true
        strMessage += 'You must provide an issuing organization.'
    }

    if(blnError == false){
        try {
            const strMethod = strEditingCertificationID.length > 0 ? 'PUT' : 'POST'
            const objPayload = strEditingCertificationID.length > 0
                ? {strCertificationID: strEditingCertificationID, strCertificationName, strIssuingOrganization, strDateEarned}
                : {strCertificationName, strIssuingOrganization, strDateEarned}

            const objResponse = await fetch(`${strBaseUrl}/api/certifications`, {
                method: strMethod,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: strEditingCertificationID.length > 0 ? "Certification updated successfully" : "Certification saved successfully",
                    icon: "success",
                    timer: 1500
                })
                resetCertificationForm()
                await loadCertifications()
            } else {
                const objErrorData = await objResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || objResponse.status)
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage.trim(),
            icon: "error"
        })
    }
})

document.querySelector('#btnCancelEditCertification').addEventListener('click', async () => {
    resetCertificationForm()
    await loadCertifications()
})

document.querySelector('#divCertificationsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteCertification_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditCertification_"]')

    if(objDeleteBtn){
        const strCertificationID = objDeleteBtn.id.replace('btnDeleteCertification_', '')

        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This certification will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/certifications/${strCertificationID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Certification deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadCertifications()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete certification')
                }
            } catch(objError) {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            }
        }
    }

    if(objEditBtn){
        const strCertificationID = objEditBtn.id.replace('btnEditCertification_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/certifications`)

            if(objResponse.ok == false){
                throw new Error('Failed to load certification for editing')
            }

            const arrCertifications = await objResponse.json()
            const objCertification = arrCertifications.find((objCurrentCertification) => objCurrentCertification.strCertificationID === strCertificationID)

            if(objCertification){
                strEditingCertificationID = objCertification.strCertificationID
                document.querySelector('#txtCertificationName').value = objCertification.strCertificationName
                document.querySelector('#txtIssuingOrganization').value = objCertification.strIssuingOrganization
                document.querySelector('#txtDateEarned').value = objCertification.strDateEarned
                document.querySelector('#btnSaveCertification').innerText = 'Update Certification'
                document.querySelector('#btnCancelEditCertification').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    }
})

// ============================================================
// SECTION: Resume Builder
// ============================================================
const loadResumeBuilder = async () => {
    try {
        const [objJobsResponse, objSkillsResponse, objAwardsResponse, objCertificationsResponse] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`)
        ])

        if(objJobsResponse.ok == false || objSkillsResponse.ok == false || objAwardsResponse.ok == false || objCertificationsResponse.ok == false){
            throw new Error('Failed to load resume builder data')
        }

        const arrJobs = await objJobsResponse.json()
        const arrSkills = await objSkillsResponse.json()
        const arrAwards = await objAwardsResponse.json()
        const arrCertifications = await objCertificationsResponse.json()

        document.querySelector('#divResumeSelections').innerHTML = ''

        let strJobsHtml = ''
        let strSkillsHtml = ''
        let strAwardsHtml = ''
        let strCertificationsHtml = ''

        arrJobs.forEach((objJob) => {
            let strResponsibilitiesHtml = ''

            objJob.arrResponsibilities.forEach((objResponsibility) => {
                strResponsibilitiesHtml += `
                    <div class="form-check ms-4 mt-2">
                        <input
                            class="form-check-input"
                            id="chkResponsibility_${objResponsibility.strResponsibilityID}"
                            type="checkbox"
                            value="${objResponsibility.strResponsibilityID}"
                            data-role="responsibility"
                            data-jobid="${objJob.strJobID}"
                            aria-label="Select responsibility">
                        <label class="form-check-label" for="chkResponsibility_${objResponsibility.strResponsibilityID}">
                            ${objResponsibility.strDescription}
                        </label>
                    </div>`
            })

            strJobsHtml += `
                <div class="border rounded p-3 mb-3">
                    <div class="form-check">
                        <input
                            class="form-check-input"
                            id="chkJob_${objJob.strJobID}"
                            type="checkbox"
                            value="${objJob.strJobID}"
                            data-role="job"
                            aria-label="Select job ${objJob.strRoleName}">
                        <label class="form-check-label fw-bold" for="chkJob_${objJob.strJobID}">
                            ${objJob.strRoleName} at ${objJob.strCompanyName}
                        </label>
                    </div>
                    ${strResponsibilitiesHtml}
                </div>`
        })

        arrSkills.forEach((objSkill) => {
            strSkillsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkSkill_${objSkill.strSkillID}"
                        type="checkbox"
                        value="${objSkill.strSkillID}"
                        data-role="skill"
                        aria-label="Select skill ${objSkill.strSkillName}">
                    <label class="form-check-label" for="chkSkill_${objSkill.strSkillID}">
                        ${objSkill.strSkillName}${objSkill.strProficiencyLevel.length > 0 ? ` (${objSkill.strProficiencyLevel})` : ''}
                    </label>
                </div>`
        })

        arrAwards.forEach((objAward) => {
            strAwardsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkAward_${objAward.strAwardID}"
                        type="checkbox"
                        value="${objAward.strAwardID}"
                        data-role="award"
                        aria-label="Select award ${objAward.strAwardName}">
                    <label class="form-check-label" for="chkAward_${objAward.strAwardID}">
                        ${objAward.strAwardName}
                    </label>
                </div>`
        })

        arrCertifications.forEach((objCertification) => {
            strCertificationsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkCertification_${objCertification.strCertificationID}"
                        type="checkbox"
                        value="${objCertification.strCertificationID}"
                        data-role="certification"
                        aria-label="Select certification ${objCertification.strCertificationName}">
                    <label class="form-check-label" for="chkCertification_${objCertification.strCertificationID}">
                        ${objCertification.strCertificationName}
                    </label>
                </div>`
        })

        document.querySelector('#divResumeSelections').innerHTML = `
            <div class="row g-4">
                <div class="col-12">
                    <div class="card border-0 bg-body-tertiary">
                        <div class="card-body">
                            <h3 class="h5">Jobs and Responsibilities</h3>
                            ${strJobsHtml.length > 0 ? strJobsHtml : '<p class="mb-0 text-muted">No jobs available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Skills</h3>
                            ${strSkillsHtml.length > 0 ? strSkillsHtml : '<p class="mb-0 text-muted">No skills available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Awards</h3>
                            ${strAwardsHtml.length > 0 ? strAwardsHtml : '<p class="mb-0 text-muted">No awards available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Certifications</h3>
                            ${strCertificationsHtml.length > 0 ? strCertificationsHtml : '<p class="mb-0 text-muted">No certifications available yet.</p>'}
                        </div>
                    </div>
                </div>
            </div>`
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load resume builder data",
            icon: "error"
        })
    }
}

document.querySelector('#btnPreviewResume').addEventListener('click', async () => {
    try {
        const [objJobsResponse, objSkillsResponse, objAwardsResponse, objCertificationsResponse] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`)
        ])

        if(objJobsResponse.ok == false || objSkillsResponse.ok == false || objAwardsResponse.ok == false || objCertificationsResponse.ok == false){
            throw new Error('Failed to build resume preview')
        }

        const arrJobs = await objJobsResponse.json()
        const arrSkills = await objSkillsResponse.json()
        const arrAwards = await objAwardsResponse.json()
        const arrCertifications = await objCertificationsResponse.json()

        const arrSelectedJobIDs = Array.from(document.querySelectorAll('[data-role="job"]:checked')).map((objCheckbox) => objCheckbox.value)
        const arrSelectedResponsibilityIDs = Array.from(document.querySelectorAll('[data-role="responsibility"]:checked')).map((objCheckbox) => objCheckbox.value)
        const arrSelectedSkillIDs = Array.from(document.querySelectorAll('[data-role="skill"]:checked')).map((objCheckbox) => objCheckbox.value)
        const arrSelectedAwardIDs = Array.from(document.querySelectorAll('[data-role="award"]:checked')).map((objCheckbox) => objCheckbox.value)
        const arrSelectedCertificationIDs = Array.from(document.querySelectorAll('[data-role="certification"]:checked')).map((objCheckbox) => objCheckbox.value)

        let blnError = false
        let strMessage = ''

        if(arrSelectedJobIDs.length < 1 && arrSelectedSkillIDs.length < 1 && arrSelectedAwardIDs.length < 1 && arrSelectedCertificationIDs.length < 1){
            blnError = true
            strMessage += 'Select at least one resume item before previewing.'
        }

        if(blnError == false){
            let strPreviewHtml = ''

        const arrSelectedJobs = arrJobs.filter((objJob) => {
            const blnSelectedByJob = arrSelectedJobIDs.includes(objJob.strJobID)
            const blnSelectedByResponsibility = objJob.arrResponsibilities.some((objResponsibility) => arrSelectedResponsibilityIDs.includes(objResponsibility.strResponsibilityID))
            return blnSelectedByJob || blnSelectedByResponsibility
        })
            const arrSelectedSkills = arrSkills.filter((objSkill) => arrSelectedSkillIDs.includes(objSkill.strSkillID))
            const arrSelectedAwards = arrAwards.filter((objAward) => arrSelectedAwardIDs.includes(objAward.strAwardID))
            const arrSelectedCertifications = arrCertifications.filter((objCertification) => arrSelectedCertificationIDs.includes(objCertification.strCertificationID))

            if(arrSelectedJobs.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Experience</h4>'
                arrSelectedJobs.forEach((objJob) => {
                    let strResponsibilityHtml = ''

                    objJob.arrResponsibilities
                        .filter((objResponsibility) => arrSelectedResponsibilityIDs.includes(objResponsibility.strResponsibilityID))
                        .forEach((objResponsibility) => {
                            strResponsibilityHtml += `<li>${objResponsibility.strDescription}</li>`
                        })

                    strPreviewHtml += `
                        <div class="mb-3">
                            <p class="fw-bold mb-1">${objJob.strRoleName}</p>
                            <p class="mb-1">${objJob.strCompanyName}</p>
                            <p class="text-muted mb-2">${objJob.strStartDate} - ${objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'}</p>
                            ${strResponsibilityHtml.length > 0 ? `<ul>${strResponsibilityHtml}</ul>` : ''}
                        </div>`
                })
                strPreviewHtml += '</section>'
            }

            if(arrSelectedSkills.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Skills</h4><ul>'
                arrSelectedSkills.forEach((objSkill) => {
                    strPreviewHtml += `<li>${objSkill.strSkillName}${objSkill.strProficiencyLevel.length > 0 ? ` - ${objSkill.strProficiencyLevel}` : ''}</li>`
                })
                strPreviewHtml += '</ul></section>'
            }

            if(arrSelectedAwards.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Awards</h4><ul>'
                arrSelectedAwards.forEach((objAward) => {
                    strPreviewHtml += `<li>${objAward.strAwardName}${objAward.strAwardDate.length > 0 ? ` (${objAward.strAwardDate})` : ''}${objAward.strDescription.length > 0 ? ` - ${objAward.strDescription}` : ''}</li>`
                })
                strPreviewHtml += '</ul></section>'
            }

            if(arrSelectedCertifications.length > 0){
                strPreviewHtml += '<section class="mb-0"><h4 class="h5 border-bottom pb-2">Certifications</h4><ul>'
                arrSelectedCertifications.forEach((objCertification) => {
                    strPreviewHtml += `<li>${objCertification.strCertificationName} - ${objCertification.strIssuingOrganization}${objCertification.strDateEarned.length > 0 ? ` (${objCertification.strDateEarned})` : ''}</li>`
                })
                strPreviewHtml += '</ul></section>'
            }

            document.querySelector('#divPreviewContent').innerHTML = strPreviewHtml
            document.querySelector('#divResumePreview').classList.remove('d-none')
            document.querySelector('#divGeminiFeedback').classList.add('d-none')
            document.querySelector('#divFeedbackContent').innerHTML = ''
        } else {
            Swal.fire({
                title: "Validation Error",
                text: strMessage,
                icon: "error"
            })
        }
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: objError.message,
            icon: "error"
        })
    }
})

document.querySelector('#btnGetFeedback').addEventListener('click', async () => {
    const strResumeContent = document.querySelector('#divPreviewContent').innerText.trim()

    let blnError = false
    let strMessage = ''

    if(strResumeContent.length < 1){
        blnError = true
        strMessage += 'Preview your resume before requesting feedback.'
    }

    if(blnError == false){
        try {
            const objResponse = await fetch(`${strBaseUrl}/api/gemini`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({strResumeContent})
            })

            if(objResponse.status === 429){
                const objErrorData = await objResponse.json()
                Swal.fire({
                    title: "Rate Limit Reached",
                    text: objErrorData.message,
                    icon: "warning"
                })
                return
            }

            if(objResponse.ok){
                const objData = await objResponse.json()

                let strFeedbackHtml = '<div class="row g-3">'

                strFeedbackHtml += `
                    <div class="col-md-4">
                        <div class="card h-100 border-success">
                            <div class="card-body">
                                <h4 class="h5 text-success">Strengths</h4>
                                <ul>${objData.strengths.map((strItem) => `<li>${strItem}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </div>`

                strFeedbackHtml += `
                    <div class="col-md-4">
                        <div class="card h-100 border-warning">
                            <div class="card-body">
                                <h4 class="h5 text-warning">Weaknesses</h4>
                                <ul>${objData.weaknesses.map((strItem) => `<li>${strItem}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </div>`

                strFeedbackHtml += `
                    <div class="col-md-4">
                        <div class="card h-100 border-primary">
                            <div class="card-body">
                                <h4 class="h5 text-primary">Suggestions</h4>
                                <ul>${objData.suggestions.map((strItem) => `<li>${strItem}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </div>`

                strFeedbackHtml += '</div>'

                document.querySelector('#divFeedbackContent').innerHTML = strFeedbackHtml
                document.querySelector('#divGeminiFeedback').classList.remove('d-none')
            } else {
                const objErrorData = await objResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to get feedback')
            }
        } catch(objError) {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

// ============================================================
// INITIALIZATION
// ============================================================
const init = async () => {
    try {
        resetJobForm()
        resetSkillForm()
        resetAwardForm()
        resetCertificationForm()
        await loadDashboard()
    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to initialize application",
            icon: "error"
        })
    }
}

init()
