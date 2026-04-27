// ============================================================
// CONSTANTS
// ============================================================

// Base URL for all fetch calls — must match the HTTP_PORT in server.js
const strBaseUrl = 'http://localhost:3000'

// Mutable state variables that track which record is currently being edited
// in each section's form.  An empty string means "add mode".
let strEditingJobID = ''
let strEditingSkillID = ''
let strEditingAwardID = ''
let strEditingCertificationID = ''
let strEditingEducationID = ''

// ============================================================
// SECTION: Sidebar Toggle
// ============================================================

// Clicking the hamburger button toggles the sidebar visibility.
// Bootstrap's d-none class is toggled so the sidebar collapses
// and the content area expands to fill the freed space.
document.querySelector('#btnSidebarToggle').addEventListener('click', () => {
    document.querySelector('#divSidebar').classList.toggle('d-none')
})

// ============================================================
// NAVIGATION
// ============================================================

// showSection hides every section then reveals only the requested one.
// It also updates the topbar label so the user always knows where they are.
const showSection = (strSectionID, strSectionLabel) => {
    // Complete list of all section IDs — must stay in sync with index.html
    const arrSections = [
        '#divDashboard',
        '#divProfile',
        '#divEducation',
        '#divJobs',
        '#divSkills',
        '#divAwards',
        '#divCertifications',
        '#divResumeBuilder'
    ]

    // Hide every section first
    arrSections.forEach(strSection => {
        document.querySelector(strSection).classList.add('d-none')
    })

    // Reveal the requested section
    document.querySelector(strSectionID).classList.remove('d-none')

    // Update the topbar breadcrumb label
    document.querySelector('#spnCurrentSection').innerText = strSectionLabel
}

// ============================================================
// NAVBAR EVENT LISTENERS
// ============================================================

// Each sidebar button reveals its corresponding section and loads fresh data.

document.querySelector('#btnNavDashboard').addEventListener('click', async () => {
    showSection('#divDashboard', 'Dashboard')
    await loadDashboard()
})

document.querySelector('#btnNavProfile').addEventListener('click', async () => {
    showSection('#divProfile', 'Profile')
    await loadProfile()
})

document.querySelector('#btnNavEducation').addEventListener('click', async () => {
    showSection('#divEducation', 'Education')
    await loadEducation()
})

document.querySelector('#btnNavJobs').addEventListener('click', async () => {
    showSection('#divJobs', 'Jobs')
    await loadJobs()
})

document.querySelector('#btnNavSkills').addEventListener('click', async () => {
    showSection('#divSkills', 'Skills')
    await loadSkills()
})

document.querySelector('#btnNavAwards').addEventListener('click', async () => {
    showSection('#divAwards', 'Awards')
    await loadAwards()
})

document.querySelector('#btnNavCertifications').addEventListener('click', async () => {
    showSection('#divCertifications', 'Certifications')
    await loadCertifications()
})

document.querySelector('#btnNavResumeBuilder').addEventListener('click', async () => {
    showSection('#divResumeBuilder', 'Resume Builder')
    await loadResumeBuilder()
})

// ============================================================
// SECTION: Dashboard
// ============================================================

// loadDashboard fetches all five resource counts in parallel using
// Promise.all so the dashboard refreshes in a single round-trip.
const loadDashboard = async () => {
    try {
        // Fire all five GET requests simultaneously
        const [objJobs, objSkills, objAwards, objCerts, objEdu] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`),
            fetch(`${strBaseUrl}/api/education`)
        ])

        // Bail out early if any request failed
        if(
            objJobs.ok == false ||
            objSkills.ok == false ||
            objAwards.ok == false ||
            objCerts.ok == false ||
            objEdu.ok == false
        ){
            throw new Error('Failed to load dashboard data')
        }

        // Parse all five response bodies
        const arrJobs = await objJobs.json()
        const arrSkills = await objSkills.json()
        const arrAwards = await objAwards.json()
        const arrCerts = await objCerts.json()
        const arrEdu = await objEdu.json()

        // Update every stat card count
        document.querySelector('#pJobCount').innerText = arrJobs.length
        document.querySelector('#pSkillCount').innerText = arrSkills.length
        document.querySelector('#pAwardCount').innerText = arrAwards.length
        document.querySelector('#pCertCount').innerText = arrCerts.length
        document.querySelector('#pEduCount').innerText = arrEdu.length

    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load dashboard data",
            icon: "error"
        })
    }
}

// ============================================================
// SECTION: Profile
// ============================================================

// loadProfile fetches the profile record and pre-populates the form
// if one already exists.  If the database is empty the form stays blank.
const loadProfile = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/profile`)

        if(objResponse.ok == false){
            throw new Error('Failed to load profile')
        }

        const arrProfile = await objResponse.json()

        // Pre-populate all fields when a profile record is present
        if(arrProfile.length > 0){
            const objProfile = arrProfile[0]
            document.querySelector('#txtFullName').value = objProfile.strFullName || ''
            document.querySelector('#txtPhone').value = objProfile.strPhone || ''
            document.querySelector('#txtEmail').value = objProfile.strEmail || ''
            document.querySelector('#txtLinkedIn').value = objProfile.strLinkedIn || ''
            document.querySelector('#txtGitHub').value = objProfile.strGitHub || ''
            document.querySelector('#txtWebsite').value = objProfile.strWebsite || ''
        }

    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load profile",
            icon: "error"
        })
    }
}

// btnSaveProfile determines whether to POST (first save) or PUT (update)
// by checking whether a profile record already exists before submitting.
document.querySelector('#btnSaveProfile').addEventListener('click', async () => {
    const strFullName = document.querySelector('#txtFullName').value.trim()
    const strPhone = document.querySelector('#txtPhone').value.trim()
    const strEmail = document.querySelector('#txtEmail').value.trim()
    const strLinkedIn = document.querySelector('#txtLinkedIn').value.trim()
    const strGitHub = document.querySelector('#txtGitHub').value.trim()
    const strWebsite = document.querySelector('#txtWebsite').value.trim()

    let blnError = false
    let strMessage = ''

    if(strFullName.length < 1){
        blnError = true
        strMessage += 'You must provide your full name. '
    }

    if(blnError == false){
        try {
            // Check whether a profile record already exists so we know
            // whether to call POST (create) or PUT (update)
            const objCheckResponse = await fetch(`${strBaseUrl}/api/profile`)

            if(objCheckResponse.ok == false){
                throw new Error('Failed to check existing profile')
            }

            const arrExistingProfile = await objCheckResponse.json()
            const blnProfileExists = arrExistingProfile.length > 0

            // Build the payload — PUT needs the existing strProfileID
            const objPayload = blnProfileExists
                ? {
                    strProfileID: arrExistingProfile[0].strProfileID,
                    strFullName,
                    strPhone,
                    strEmail,
                    strLinkedIn,
                    strGitHub,
                    strWebsite
                }
                : {strFullName, strPhone, strEmail, strLinkedIn, strGitHub, strWebsite}

            const strMethod = blnProfileExists ? 'PUT' : 'POST'

            const objResponse = await fetch(`${strBaseUrl}/api/profile`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: blnProfileExists ? "Profile updated successfully" : "Profile saved successfully",
                    icon: "success",
                    timer: 1500
                })
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

// ============================================================
// SECTION: Education
// ============================================================

// resetEducationForm clears all education form inputs and returns
// the save button text to its default "Save Education" label.
const resetEducationForm = () => {
    document.querySelector('#txtInstitutionName').value = ''
    document.querySelector('#txtDegree').value = ''
    document.querySelector('#txtFieldOfStudy').value = ''
    document.querySelector('#txtEduStartDate').value = ''
    document.querySelector('#txtEduEndDate').value = ''
    document.querySelector('#btnSaveEducation').innerText = 'Save Education'
    document.querySelector('#btnCancelEditEducation').classList.add('d-none')
    strEditingEducationID = ''
}

// loadEducation fetches all education records and renders them
// as cards in divEducationList.
const loadEducation = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/education`)

        if(objResponse.ok == false){
            throw new Error('Failed to load education records')
        }

        const arrEducation = await objResponse.json()
        document.querySelector('#divEducationList').innerHTML = ''

        // Empty state message
        if(arrEducation.length < 1){
            document.querySelector('#divEducationList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No education records saved yet.</p>
                    </div>
                </div>`
            return
        }

        // Build one card per education record
        arrEducation.forEach((objEducation) => {
            // Display end date or "Present" when the end date is empty
            const strDisplayEnd = objEducation.strEndDate && objEducation.strEndDate.length > 0
                ? objEducation.strEndDate
                : 'Present'

            // Show field of study only when one was provided
            const strFieldDisplay = objEducation.strFieldOfStudy && objEducation.strFieldOfStudy.length > 0
                ? ` — ${objEducation.strFieldOfStudy}`
                : ''

            document.querySelector('#divEducationList').innerHTML += `
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                            <div>
                                <h3 class="h5 mb-1">${objEducation.strInstitutionName}</h3>
                                <p class="mb-1">${objEducation.strDegree}${strFieldDisplay}</p>
                                <p class="text-muted mb-0">${objEducation.strStartDate || ''} – ${strDisplayEnd}</p>
                            </div>
                            <div>
                                <button
                                    class="btn btn-primary btn-sm me-2"
                                    type="button"
                                    id="btnEditEducation_${objEducation.strEducationID}"
                                    aria-label="Edit ${objEducation.strInstitutionName}">
                                    Edit
                                </button>
                                <button
                                    class="btn btn-danger btn-sm"
                                    type="button"
                                    id="btnDeleteEducation_${objEducation.strEducationID}"
                                    aria-label="Delete ${objEducation.strInstitutionName}">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`
        })

        // Refresh dashboard counts after any education list change
        await loadDashboard()

    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load education records",
            icon: "error"
        })
    }
}

// btnSaveEducation handles both creating a new record (POST) and
// updating an existing one (PUT) depending on strEditingEducationID.
document.querySelector('#btnSaveEducation').addEventListener('click', async () => {
    const strInstitutionName = document.querySelector('#txtInstitutionName').value.trim()
    const strDegree = document.querySelector('#txtDegree').value.trim()
    const strFieldOfStudy = document.querySelector('#txtFieldOfStudy').value.trim()
    const strEduStartDate = document.querySelector('#txtEduStartDate').value.trim()
    const strEduEndDate = document.querySelector('#txtEduEndDate').value.trim()

    let blnError = false
    let strMessage = ''

    if(strInstitutionName.length < 1){
        blnError = true
        strMessage += 'You must provide an institution name. '
    }
    if(strDegree.length < 1){
        blnError = true
        strMessage += 'You must provide a degree. '
    }

    if(blnError == false){
        try {
            const strMethod = strEditingEducationID.length > 0 ? 'PUT' : 'POST'

            // Include the ID in the payload when updating an existing record
            const objPayload = strEditingEducationID.length > 0
                ? {
                    strEducationID: strEditingEducationID,
                    strInstitutionName,
                    strDegree,
                    strFieldOfStudy,
                    strStartDate: strEduStartDate,
                    strEndDate: strEduEndDate
                }
                : {
                    strInstitutionName,
                    strDegree,
                    strFieldOfStudy,
                    strStartDate: strEduStartDate,
                    strEndDate: strEduEndDate
                }

            const objResponse = await fetch(`${strBaseUrl}/api/education`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            if(objResponse.ok){
                Swal.fire({
                    title: "Saved",
                    text: strEditingEducationID.length > 0
                        ? "Education updated successfully"
                        : "Education saved successfully",
                    icon: "success",
                    timer: 1500
                })
                resetEducationForm()
                await loadEducation()
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

// Cancel edit mode — reset form and reload list
document.querySelector('#btnCancelEditEducation').addEventListener('click', async () => {
    resetEducationForm()
    await loadEducation()
})

// Event delegation on divEducationList handles both edit and delete
// button clicks that are created dynamically inside loadEducation().
document.querySelector('#divEducationList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteEducation_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditEducation_"]')

    // ---- Delete education record ----
    if(objDeleteBtn){
        const strEducationID = objDeleteBtn.id.replace('btnDeleteEducation_', '')

        // Education deletes require a SweetAlert2 confirmation dialog
        const objResult = await Swal.fire({
            title: "Are you sure?",
            text: "This education record will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it"
        })

        if(objResult.isConfirmed){
            try {
                const objResponse = await fetch(`${strBaseUrl}/api/education/${strEducationID}`, {
                    method: 'DELETE'
                })

                if(objResponse.ok){
                    Swal.fire({
                        title: "Deleted",
                        text: "Education record deleted successfully",
                        icon: "success",
                        timer: 1500
                    })
                    await loadEducation()
                } else {
                    const objErrorData = await objResponse.json()
                    throw new Error(objErrorData.errorMessage || objErrorData.message || 'Failed to delete education record')
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

    // ---- Edit education record — populate form ----
    if(objEditBtn){
        const strEducationID = objEditBtn.id.replace('btnEditEducation_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/education`)

            if(objResponse.ok == false){
                throw new Error('Failed to load education for editing')
            }

            const arrEducation = await objResponse.json()
            const objEducation = arrEducation.find(
                (objCurrentEdu) => objCurrentEdu.strEducationID === strEducationID
            )

            if(objEducation){
                // Populate form fields with the existing record's values
                strEditingEducationID = objEducation.strEducationID
                document.querySelector('#txtInstitutionName').value = objEducation.strInstitutionName
                document.querySelector('#txtDegree').value = objEducation.strDegree
                document.querySelector('#txtFieldOfStudy').value = objEducation.strFieldOfStudy || ''
                document.querySelector('#txtEduStartDate').value = objEducation.strStartDate || ''
                document.querySelector('#txtEduEndDate').value = objEducation.strEndDate || ''
                document.querySelector('#btnSaveEducation').innerText = 'Update Education'
                document.querySelector('#btnCancelEditEducation').classList.remove('d-none')
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
// SECTION: Jobs
// ============================================================

// resetJobForm clears all job form fields and returns the button label
// to its default state so the form is ready for a new entry.
const resetJobForm = () => {
    document.querySelector('#txtRoleName').value = ''
    document.querySelector('#txtCompanyName').value = ''
    document.querySelector('#txtStartDate').value = ''
    document.querySelector('#txtEndDate').value = ''
    document.querySelector('#btnSaveJob').innerText = 'Save Job'
    document.querySelector('#btnCancelEditJob').classList.add('d-none')
    strEditingJobID = ''
}

// loadJobs fetches all jobs (with their responsibilities embedded) and
// renders a card for each one including an inline add-responsibility form.
const loadJobs = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/jobs`)

        if(objResponse.ok == false){
            throw new Error('Failed to load jobs')
        }

        const arrJobs = await objResponse.json()
        document.querySelector('#divJobsList').innerHTML = ''

        // Empty state message
        if(arrJobs.length < 1){
            document.querySelector('#divJobsList').innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <p class="mb-0 text-muted">No jobs saved yet.</p>
                    </div>
                </div>`
        }

        // Build one card per job, with responsibilities nested inside
        arrJobs.forEach((objJob) => {
            // Build the responsibility list items
            let strResponsibilitiesHtml = ''
            objJob.arrResponsibilities.forEach((objResponsibility) => {
                strResponsibilitiesHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <span class="me-3">${objResponsibility.strDescription}</span>
                        <button
                            class="btn btn-outline-danger btn-sm flex-shrink-0"
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
                                <p class="text-muted mb-0">
                                    ${objJob.strStartDate} – ${objJob.strEndDate && objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'}
                                </p>
                            </div>
                            <div class="flex-shrink-0">
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
                            ${strResponsibilitiesHtml.length > 0
                                ? strResponsibilitiesHtml
                                : '<li class="list-group-item text-muted">No responsibilities saved yet.</li>'}
                        </ul>
                    </div>
                </div>`
        })

        // Refresh dashboard counts after any change to jobs
        await loadDashboard()

    } catch(objError) {
        Swal.fire({
            title: "Error",
            text: "Failed to load jobs",
            icon: "error"
        })
    }
}

// btnSaveJob handles both creating (POST) and updating (PUT) a job record.
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
                headers: {'Content-Type': 'application/json'},
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

// Cancel job edit mode
document.querySelector('#btnCancelEditJob').addEventListener('click', async () => {
    resetJobForm()
    await loadJobs()
})

// ============================================================
// SECTION: Responsibilities
// ============================================================

// Event delegation on divJobsList handles all dynamic button clicks
// for job edit/delete and responsibility add/delete.
// Responsibility operations are SILENT — no SweetAlert2 for success,
// error, or confirmation.  The list reloads itself as visual feedback.
// Only validation errors use SweetAlert2.
document.querySelector('#divJobsList').addEventListener('click', async (objEvent) => {
    const objDeleteJobBtn = objEvent.target.closest('[id^="btnDelete_"]')
    const objEditJobBtn = objEvent.target.closest('[id^="btnEdit_"]')
    const objAddResponsibilityBtn = objEvent.target.closest('[id^="btnAddResponsibility_"]')
    const objDeleteResponsibilityBtn = objEvent.target.closest('[id^="btnDeleteResponsibility_"]')

    // ---- Delete job (with SweetAlert2 confirmation) ----
    if(objDeleteJobBtn){
        const strJobID = objDeleteJobBtn.id.replace('btnDelete_', '')

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

    // ---- Edit job — populate the form ----
    if(objEditJobBtn){
        const strJobID = objEditJobBtn.id.replace('btnEdit_', '')

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
                document.querySelector('#txtEndDate').value = objJob.strEndDate || ''
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

    // ---- Add responsibility (SILENT — no SweetAlert2 for success/error) ----
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({strJobID, strDescription})
                })

                // Silent reload regardless of success or failure —
                // the list state reflects the actual database state
                await loadJobs()

            } catch(objError) {
                // Silent catch — list reload provides the visual feedback
                console.error('Failed to add responsibility:', objError.message)
            }

        } else {
            // Validation errors DO use SweetAlert2 ("any validation error anywhere")
            Swal.fire({
                title: "Validation Error",
                text: strMessage,
                icon: "error"
            })
        }
    }

    // ---- Delete responsibility (SILENT — no confirmation, no SweetAlert2) ----
    if(objDeleteResponsibilityBtn){
        const strResponsibilityID = objDeleteResponsibilityBtn.id.replace('btnDeleteResponsibility_', '')

        try {
            await fetch(`${strBaseUrl}/api/responsibilities/${strResponsibilityID}`, {
                method: 'DELETE'
            })

            // Silent reload — the disappearing item confirms the delete
            await loadJobs()

        } catch(objError) {
            // Silent catch
            console.error('Failed to delete responsibility:', objError.message)
        }
    }
})

// ============================================================
// SECTION: Skills
// ============================================================

// resetSkillForm clears inputs and resets the button/state for add mode.
const resetSkillForm = () => {
    document.querySelector('#txtSkillName').value = ''
    document.querySelector('#txtProficiencyLevel').value = ''
    document.querySelector('#btnSaveSkill').innerText = 'Save Skill'
    document.querySelector('#btnCancelEditSkill').classList.add('d-none')
    strEditingSkillID = ''
}

// loadSkills fetches and renders all skill cards.
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
                            <p class="mb-0 text-muted">
                                ${objSkill.strProficiencyLevel && objSkill.strProficiencyLevel.length > 0
                                    ? objSkill.strProficiencyLevel
                                    : 'No proficiency level provided'}
                            </p>
                        </div>
                        <div class="flex-shrink-0">
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
        // Skills load errors are surfaced silently via console only;
        // the empty list state provides implicit visual feedback
        console.error('Failed to load skills:', objError.message)
    }
}

// btnSaveSkill handles both POST and PUT for skills.
// Add/update SUCCESS and ERROR are SILENT — only validation errors use Swal.
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

            await fetch(`${strBaseUrl}/api/skills`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            // Silent reload — refreshed list is the visual confirmation
            resetSkillForm()
            await loadSkills()

        } catch(objError) {
            console.error('Failed to save skill:', objError.message)
        }
    } else {
        // Validation errors always use SweetAlert2
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

// Cancel skill edit mode
document.querySelector('#btnCancelEditSkill').addEventListener('click', async () => {
    resetSkillForm()
    await loadSkills()
})

// Event delegation on divSkillsList — delete and edit are SILENT
// (no SweetAlert2 for confirmation, success, or error).
document.querySelector('#divSkillsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteSkill_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditSkill_"]')

    // ---- Delete skill (SILENT — no confirmation dialog) ----
    if(objDeleteBtn){
        const strSkillID = objDeleteBtn.id.replace('btnDeleteSkill_', '')

        try {
            await fetch(`${strBaseUrl}/api/skills/${strSkillID}`, {method: 'DELETE'})
            await loadSkills()
        } catch(objError) {
            console.error('Failed to delete skill:', objError.message)
        }
    }

    // ---- Edit skill — populate form ----
    if(objEditBtn){
        const strSkillID = objEditBtn.id.replace('btnEditSkill_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/skills`)

            if(objResponse.ok == false){
                throw new Error('Failed to load skill for editing')
            }

            const arrSkills = await objResponse.json()
            const objSkill = arrSkills.find(
                (objCurrentSkill) => objCurrentSkill.strSkillID === strSkillID
            )

            if(objSkill){
                strEditingSkillID = objSkill.strSkillID
                document.querySelector('#txtSkillName').value = objSkill.strSkillName
                document.querySelector('#txtProficiencyLevel').value = objSkill.strProficiencyLevel || ''
                document.querySelector('#btnSaveSkill').innerText = 'Update Skill'
                document.querySelector('#btnCancelEditSkill').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }

        } catch(objError) {
            console.error('Failed to load skill for editing:', objError.message)
        }
    }
})

// ============================================================
// SECTION: Awards
// ============================================================

// resetAwardForm clears inputs and returns the form to add mode.
const resetAwardForm = () => {
    document.querySelector('#txtAwardName').value = ''
    document.querySelector('#txtAwardDate').value = ''
    document.querySelector('#txtAwardDescription').value = ''
    document.querySelector('#btnSaveAward').innerText = 'Save Award'
    document.querySelector('#btnCancelEditAward').classList.add('d-none')
    strEditingAwardID = ''
}

// loadAwards fetches and renders all award cards.
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
                            <p class="mb-1 text-muted">
                                ${objAward.strAwardDate && objAward.strAwardDate.length > 0
                                    ? objAward.strAwardDate
                                    : 'No award date provided'}
                            </p>
                            <p class="mb-0">
                                ${objAward.strDescription && objAward.strDescription.length > 0
                                    ? objAward.strDescription
                                    : 'No description provided'}
                            </p>
                        </div>
                        <div class="flex-shrink-0">
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
        console.error('Failed to load awards:', objError.message)
    }
}

// btnSaveAward — SILENT success/error; only validation uses Swal.
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

            await fetch(`${strBaseUrl}/api/awards`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            resetAwardForm()
            await loadAwards()

        } catch(objError) {
            console.error('Failed to save award:', objError.message)
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

// Cancel award edit mode
document.querySelector('#btnCancelEditAward').addEventListener('click', async () => {
    resetAwardForm()
    await loadAwards()
})

// Event delegation on divAwardsList — SILENT (no Swal for confirm/success/error).
document.querySelector('#divAwardsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteAward_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditAward_"]')

    // ---- Delete award (SILENT) ----
    if(objDeleteBtn){
        const strAwardID = objDeleteBtn.id.replace('btnDeleteAward_', '')

        try {
            await fetch(`${strBaseUrl}/api/awards/${strAwardID}`, {method: 'DELETE'})
            await loadAwards()
        } catch(objError) {
            console.error('Failed to delete award:', objError.message)
        }
    }

    // ---- Edit award — populate form ----
    if(objEditBtn){
        const strAwardID = objEditBtn.id.replace('btnEditAward_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/awards`)

            if(objResponse.ok == false){
                throw new Error('Failed to load award for editing')
            }

            const arrAwards = await objResponse.json()
            const objAward = arrAwards.find(
                (objCurrentAward) => objCurrentAward.strAwardID === strAwardID
            )

            if(objAward){
                strEditingAwardID = objAward.strAwardID
                document.querySelector('#txtAwardName').value = objAward.strAwardName
                document.querySelector('#txtAwardDate').value = objAward.strAwardDate || ''
                document.querySelector('#txtAwardDescription').value = objAward.strDescription || ''
                document.querySelector('#btnSaveAward').innerText = 'Update Award'
                document.querySelector('#btnCancelEditAward').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }

        } catch(objError) {
            console.error('Failed to load award for editing:', objError.message)
        }
    }
})

// ============================================================
// SECTION: Certifications
// ============================================================

// resetCertificationForm clears inputs and returns form to add mode.
const resetCertificationForm = () => {
    document.querySelector('#txtCertificationName').value = ''
    document.querySelector('#txtIssuingOrganization').value = ''
    document.querySelector('#txtDateEarned').value = ''
    document.querySelector('#btnSaveCertification').innerText = 'Save Certification'
    document.querySelector('#btnCancelEditCertification').classList.add('d-none')
    strEditingCertificationID = ''
}

// loadCertifications fetches and renders all certification cards.
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
                            <p class="mb-0 text-muted">
                                ${objCertification.strDateEarned && objCertification.strDateEarned.length > 0
                                    ? objCertification.strDateEarned
                                    : 'No date earned provided'}
                            </p>
                        </div>
                        <div class="flex-shrink-0">
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
        console.error('Failed to load certifications:', objError.message)
    }
}

// btnSaveCertification — SILENT success/error; validation uses Swal.
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
                ? {
                    strCertificationID: strEditingCertificationID,
                    strCertificationName,
                    strIssuingOrganization,
                    strDateEarned
                }
                : {strCertificationName, strIssuingOrganization, strDateEarned}

            await fetch(`${strBaseUrl}/api/certifications`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            resetCertificationForm()
            await loadCertifications()

        } catch(objError) {
            console.error('Failed to save certification:', objError.message)
        }
    } else {
        Swal.fire({
            title: "Validation Error",
            text: strMessage.trim(),
            icon: "error"
        })
    }
})

// Cancel certification edit mode
document.querySelector('#btnCancelEditCertification').addEventListener('click', async () => {
    resetCertificationForm()
    await loadCertifications()
})

// Event delegation on divCertificationsList — SILENT.
document.querySelector('#divCertificationsList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteCertification_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditCertification_"]')

    // ---- Delete certification (SILENT) ----
    if(objDeleteBtn){
        const strCertificationID = objDeleteBtn.id.replace('btnDeleteCertification_', '')

        try {
            await fetch(`${strBaseUrl}/api/certifications/${strCertificationID}`, {method: 'DELETE'})
            await loadCertifications()
        } catch(objError) {
            console.error('Failed to delete certification:', objError.message)
        }
    }

    // ---- Edit certification — populate form ----
    if(objEditBtn){
        const strCertificationID = objEditBtn.id.replace('btnEditCertification_', '')

        try {
            const objResponse = await fetch(`${strBaseUrl}/api/certifications`)

            if(objResponse.ok == false){
                throw new Error('Failed to load certification for editing')
            }

            const arrCertifications = await objResponse.json()
            const objCertification = arrCertifications.find(
                (objCurrentCert) => objCurrentCert.strCertificationID === strCertificationID
            )

            if(objCertification){
                strEditingCertificationID = objCertification.strCertificationID
                document.querySelector('#txtCertificationName').value = objCertification.strCertificationName
                document.querySelector('#txtIssuingOrganization').value = objCertification.strIssuingOrganization
                document.querySelector('#txtDateEarned').value = objCertification.strDateEarned || ''
                document.querySelector('#btnSaveCertification').innerText = 'Update Certification'
                document.querySelector('#btnCancelEditCertification').classList.remove('d-none')
                window.scrollTo({top: 0, behavior: 'smooth'})
            }

        } catch(objError) {
            console.error('Failed to load certification for editing:', objError.message)
        }
    }
})

// ============================================================
// SECTION: Resume Builder
// ============================================================

// loadResumeBuilder fetches all six data sources and builds the
// selection panel with checkboxes for every resume item.
// Profile information is always included when present — no checkbox needed.
const loadResumeBuilder = async () => {
    try {
        // Fetch all resources in parallel to keep load time minimal
        const [
            objJobsResponse,
            objSkillsResponse,
            objAwardsResponse,
            objCertificationsResponse,
            objProfileResponse,
            objEducationResponse
        ] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`),
            fetch(`${strBaseUrl}/api/profile`),
            fetch(`${strBaseUrl}/api/education`)
        ])

        if(
            objJobsResponse.ok == false ||
            objSkillsResponse.ok == false ||
            objAwardsResponse.ok == false ||
            objCertificationsResponse.ok == false ||
            objProfileResponse.ok == false ||
            objEducationResponse.ok == false
        ){
            throw new Error('Failed to load resume builder data')
        }

        const arrJobs = await objJobsResponse.json()
        const arrSkills = await objSkillsResponse.json()
        const arrAwards = await objAwardsResponse.json()
        const arrCertifications = await objCertificationsResponse.json()
        const arrProfile = await objProfileResponse.json()
        const arrEducation = await objEducationResponse.json()

        document.querySelector('#divResumeSelections').innerHTML = ''

        // ---- Profile (always-included notice, no checkbox) ----
        let strProfileHtml = ''
        if(arrProfile.length > 0){
            const objProfile = arrProfile[0]
            strProfileHtml = `
                <div class="alert alert-primary d-flex align-items-center mb-3" role="alert">
                    <i class="fas fa-user fa-fw me-2"></i>
                    <div>
                        <strong>Profile — always included:</strong>
                        ${objProfile.strFullName}
                        ${objProfile.strEmail && objProfile.strEmail.length > 0 ? objProfile.strEmail : ''}
                        ${objProfile.strPhone && objProfile.strPhone.length > 0 ? ' · ' + objProfile.strPhone : ''}
                        ${objProfile.strLinkedIn && objProfile.strLinkedIn.length > 0 ? ' · ' + objProfile.strLinkedIn : ''}
                    </div>
                </div>`
        }

        // ---- Jobs with nested responsibility checkboxes ----
        let strJobsHtml = ''
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
                            aria-label="Select responsibility: ${objResponsibility.strDescription}">
                        <label class="form-check-label"
                               for="chkResponsibility_${objResponsibility.strResponsibilityID}">
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
                            aria-label="Select job: ${objJob.strRoleName} at ${objJob.strCompanyName}">
                        <label class="form-check-label fw-bold" for="chkJob_${objJob.strJobID}">
                            ${objJob.strRoleName} at ${objJob.strCompanyName}
                        </label>
                    </div>
                    ${strResponsibilitiesHtml}
                </div>`
        })

        // ---- Education checkboxes ----
        let strEducationHtml = ''
        arrEducation.forEach((objEducation) => {
            strEducationHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkEducation_${objEducation.strEducationID}"
                        type="checkbox"
                        value="${objEducation.strEducationID}"
                        data-role="education"
                        aria-label="Select education: ${objEducation.strDegree} from ${objEducation.strInstitutionName}">
                    <label class="form-check-label" for="chkEducation_${objEducation.strEducationID}">
                        ${objEducation.strDegree}
                        ${objEducation.strFieldOfStudy && objEducation.strFieldOfStudy.length > 0
                            ? ' in ' + objEducation.strFieldOfStudy
                            : ''}
                        &mdash; ${objEducation.strInstitutionName}
                    </label>
                </div>`
        })

        // ---- Skills checkboxes ----
        let strSkillsHtml = ''
        arrSkills.forEach((objSkill) => {
            strSkillsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkSkill_${objSkill.strSkillID}"
                        type="checkbox"
                        value="${objSkill.strSkillID}"
                        data-role="skill"
                        aria-label="Select skill: ${objSkill.strSkillName}">
                    <label class="form-check-label" for="chkSkill_${objSkill.strSkillID}">
                        ${objSkill.strSkillName}
                        ${objSkill.strProficiencyLevel && objSkill.strProficiencyLevel.length > 0
                            ? ' (' + objSkill.strProficiencyLevel + ')'
                            : ''}
                    </label>
                </div>`
        })

        // ---- Awards checkboxes ----
        let strAwardsHtml = ''
        arrAwards.forEach((objAward) => {
            strAwardsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkAward_${objAward.strAwardID}"
                        type="checkbox"
                        value="${objAward.strAwardID}"
                        data-role="award"
                        aria-label="Select award: ${objAward.strAwardName}">
                    <label class="form-check-label" for="chkAward_${objAward.strAwardID}">
                        ${objAward.strAwardName}
                    </label>
                </div>`
        })

        // ---- Certifications checkboxes ----
        let strCertificationsHtml = ''
        arrCertifications.forEach((objCertification) => {
            strCertificationsHtml += `
                <div class="form-check mb-2">
                    <input
                        class="form-check-input"
                        id="chkCertification_${objCertification.strCertificationID}"
                        type="checkbox"
                        value="${objCertification.strCertificationID}"
                        data-role="certification"
                        aria-label="Select certification: ${objCertification.strCertificationName}">
                    <label class="form-check-label" for="chkCertification_${objCertification.strCertificationID}">
                        ${objCertification.strCertificationName}
                    </label>
                </div>`
        })

        // Assemble the full selection panel HTML
        document.querySelector('#divResumeSelections').innerHTML = `
            ${strProfileHtml}
            <div class="row g-4">
                <div class="col-12">
                    <div class="card border-0 bg-body-tertiary">
                        <div class="card-body">
                            <h3 class="h5">Jobs and Responsibilities</h3>
                            ${strJobsHtml.length > 0
                                ? strJobsHtml
                                : '<p class="mb-0 text-muted">No jobs available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Education</h3>
                            ${strEducationHtml.length > 0
                                ? strEducationHtml
                                : '<p class="mb-0 text-muted">No education records available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Skills</h3>
                            ${strSkillsHtml.length > 0
                                ? strSkillsHtml
                                : '<p class="mb-0 text-muted">No skills available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Awards</h3>
                            ${strAwardsHtml.length > 0
                                ? strAwardsHtml
                                : '<p class="mb-0 text-muted">No awards available yet.</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-body-tertiary h-100">
                        <div class="card-body">
                            <h3 class="h5">Certifications</h3>
                            ${strCertificationsHtml.length > 0
                                ? strCertificationsHtml
                                : '<p class="mb-0 text-muted">No certifications available yet.</p>'}
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

// btnPreviewResume assembles the preview HTML from all checked items
// plus the profile (always included if present) and the selected education.
document.querySelector('#btnPreviewResume').addEventListener('click', async () => {
    try {
        // Re-fetch everything to ensure the preview is built from fresh data
        const [
            objJobsResponse,
            objSkillsResponse,
            objAwardsResponse,
            objCertificationsResponse,
            objProfileResponse,
            objEducationResponse
        ] = await Promise.all([
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/awards`),
            fetch(`${strBaseUrl}/api/certifications`),
            fetch(`${strBaseUrl}/api/profile`),
            fetch(`${strBaseUrl}/api/education`)
        ])

        if(
            objJobsResponse.ok == false ||
            objSkillsResponse.ok == false ||
            objAwardsResponse.ok == false ||
            objCertificationsResponse.ok == false ||
            objProfileResponse.ok == false ||
            objEducationResponse.ok == false
        ){
            throw new Error('Failed to build resume preview')
        }

        const arrJobs = await objJobsResponse.json()
        const arrSkills = await objSkillsResponse.json()
        const arrAwards = await objAwardsResponse.json()
        const arrCertifications = await objCertificationsResponse.json()
        const arrProfile = await objProfileResponse.json()
        const arrEducation = await objEducationResponse.json()

        // Collect the IDs of every checked item from the selection panel
        const arrSelectedJobIDs = Array.from(
            document.querySelectorAll('[data-role="job"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        const arrSelectedResponsibilityIDs = Array.from(
            document.querySelectorAll('[data-role="responsibility"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        const arrSelectedEducationIDs = Array.from(
            document.querySelectorAll('[data-role="education"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        const arrSelectedSkillIDs = Array.from(
            document.querySelectorAll('[data-role="skill"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        const arrSelectedAwardIDs = Array.from(
            document.querySelectorAll('[data-role="award"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        const arrSelectedCertificationIDs = Array.from(
            document.querySelectorAll('[data-role="certification"]:checked')
        ).map((objCheckbox) => objCheckbox.value)

        // Profile counts as content when it exists (always-included)
        const blnHasProfile = arrProfile.length > 0

        let blnError = false
        let strMessage = ''

        // Require at least one piece of content before building a preview
        if(
            blnHasProfile == false &&
            arrSelectedJobIDs.length < 1 &&
            arrSelectedEducationIDs.length < 1 &&
            arrSelectedSkillIDs.length < 1 &&
            arrSelectedAwardIDs.length < 1 &&
            arrSelectedCertificationIDs.length < 1
        ){
            blnError = true
            strMessage += 'Select at least one resume item before previewing.'
        }

        if(blnError == false){
            let strPreviewHtml = ''

            // ---- Profile section (always shown when present) ----
            if(blnHasProfile){
                const objProfile = arrProfile[0]
                const arrContactParts = []
                if(objProfile.strEmail && objProfile.strEmail.length > 0) arrContactParts.push(objProfile.strEmail)
                if(objProfile.strPhone && objProfile.strPhone.length > 0) arrContactParts.push(objProfile.strPhone)
                if(objProfile.strLinkedIn && objProfile.strLinkedIn.length > 0) arrContactParts.push(objProfile.strLinkedIn)
                if(objProfile.strGitHub && objProfile.strGitHub.length > 0) arrContactParts.push(objProfile.strGitHub)
                if(objProfile.strWebsite && objProfile.strWebsite.length > 0) arrContactParts.push(objProfile.strWebsite)

                strPreviewHtml += '<section class="mb-4 text-center">'
                strPreviewHtml += '<h2 class="h3 mb-1">' + objProfile.strFullName + '</h2>'
                if(arrContactParts.length > 0){
                    strPreviewHtml += '<p class="text-muted mb-0 small">' + arrContactParts.join(' \u00b7 ') + '</p>'
                }
                strPreviewHtml += '</section>'
            }

            // ---- Experience section ----
            // Include a job when its checkbox is checked OR at least one of its
            // responsibilities is checked (mirroring the original pattern)
            const arrSelectedJobs = arrJobs.filter((objJob) => {
                const blnJobChecked = arrSelectedJobIDs.includes(objJob.strJobID)
                const blnHasCheckedResponsibility = objJob.arrResponsibilities.some(
                    (objR) => arrSelectedResponsibilityIDs.includes(objR.strResponsibilityID)
                )
                return blnJobChecked || blnHasCheckedResponsibility
            })

            if(arrSelectedJobs.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Experience</h4>'
                arrSelectedJobs.forEach((objJob) => {
                    let strResponsibilityHtml = ''
                    objJob.arrResponsibilities
                        .filter((objR) => arrSelectedResponsibilityIDs.includes(objR.strResponsibilityID))
                        .forEach((objR) => {
                            strResponsibilityHtml += '<li>' + objR.strDescription + '</li>'
                        })

                    const strJobEnd = objJob.strEndDate && objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'
                    strPreviewHtml += '<div class="mb-3">'
                    strPreviewHtml += '<p class="fw-bold mb-1">' + objJob.strRoleName + '</p>'
                    strPreviewHtml += '<p class="mb-1">' + objJob.strCompanyName + '</p>'
                    strPreviewHtml += '<p class="text-muted mb-2">' + objJob.strStartDate + ' \u2013 ' + strJobEnd + '</p>'
                    if(strResponsibilityHtml.length > 0){
                        strPreviewHtml += '<ul>' + strResponsibilityHtml + '</ul>'
                    }
                    strPreviewHtml += '</div>'
                })
                strPreviewHtml += '</section>'
            }

            // ---- Education section ----
            const arrSelectedEducation = arrEducation.filter(
                (objEdu) => arrSelectedEducationIDs.includes(objEdu.strEducationID)
            )

            if(arrSelectedEducation.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Education</h4>'
                arrSelectedEducation.forEach((objEdu) => {
                    const strFieldDisplay = objEdu.strFieldOfStudy && objEdu.strFieldOfStudy.length > 0
                        ? ' in ' + objEdu.strFieldOfStudy
                        : ''
                    const strEduEnd = objEdu.strEndDate && objEdu.strEndDate.length > 0 ? objEdu.strEndDate : 'Present'
                    strPreviewHtml += '<div class="mb-3">'
                    strPreviewHtml += '<p class="fw-bold mb-1">' + objEdu.strInstitutionName + '</p>'
                    strPreviewHtml += '<p class="mb-1">' + objEdu.strDegree + strFieldDisplay + '</p>'
                    strPreviewHtml += '<p class="text-muted mb-0">' + (objEdu.strStartDate || '') + ' \u2013 ' + strEduEnd + '</p>'
                    strPreviewHtml += '</div>'
                })
                strPreviewHtml += '</section>'
            }

            // ---- Skills section ----
            const arrSelectedSkills = arrSkills.filter(
                (objSkill) => arrSelectedSkillIDs.includes(objSkill.strSkillID)
            )

            if(arrSelectedSkills.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Skills</h4><ul>'
                arrSelectedSkills.forEach((objSkill) => {
                    const strLevel = objSkill.strProficiencyLevel && objSkill.strProficiencyLevel.length > 0
                        ? ' \u2014 ' + objSkill.strProficiencyLevel
                        : ''
                    strPreviewHtml += '<li>' + objSkill.strSkillName + strLevel + '</li>'
                })
                strPreviewHtml += '</ul></section>'
            }

            // ---- Awards section ----
            const arrSelectedAwards = arrAwards.filter(
                (objAward) => arrSelectedAwardIDs.includes(objAward.strAwardID)
            )

            if(arrSelectedAwards.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Awards</h4><ul>'
                arrSelectedAwards.forEach((objAward) => {
                    const strDate = objAward.strAwardDate && objAward.strAwardDate.length > 0
                        ? ' (' + objAward.strAwardDate + ')'
                        : ''
                    const strDesc = objAward.strDescription && objAward.strDescription.length > 0
                        ? ' \u2014 ' + objAward.strDescription
                        : ''
                    strPreviewHtml += '<li>' + objAward.strAwardName + strDate + strDesc + '</li>'
                })
                strPreviewHtml += '</ul></section>'
            }

            // ---- Certifications section ----
            const arrSelectedCertifications = arrCertifications.filter(
                (objCertification) => arrSelectedCertificationIDs.includes(objCertification.strCertificationID)
            )

            if(arrSelectedCertifications.length > 0){
                strPreviewHtml += '<section class="mb-0"><h4 class="h5 border-bottom pb-2">Certifications</h4><ul>'
                arrSelectedCertifications.forEach((objCertification) => {
                    const strCertDate = objCertification.strDateEarned && objCertification.strDateEarned.length > 0
                        ? ' (' + objCertification.strDateEarned + ')'
                        : ''
                    strPreviewHtml += '<li>' + objCertification.strCertificationName + ' \u2014 ' + objCertification.strIssuingOrganization + strCertDate + '</li>'
                })
                strPreviewHtml += '</ul></section>'
            }

            // Inject the preview and reveal the preview panel
            document.querySelector('#divPreviewContent').innerHTML = strPreviewHtml
            document.querySelector('#divResumePreview').classList.remove('d-none')

            // Reset the feedback panel so stale feedback is never displayed
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

// btnGetFeedback sends the plain-text preview content to Gemini 2.5 Flash
// and renders the returned strengths / weaknesses / suggestions.
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({strResumeContent})
            })

            // Gemini rate limit gets its own friendly dialog
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

                // Strengths card
                strFeedbackHtml += '<div class="col-md-4"><div class="card h-100 border-success"><div class="card-body">'
                strFeedbackHtml += '<h4 class="h5 text-success">Strengths</h4><ul>'
                objData.strengths.forEach((strItem) => { strFeedbackHtml += '<li>' + strItem + '</li>' })
                strFeedbackHtml += '</ul></div></div></div>'

                // Weaknesses card
                strFeedbackHtml += '<div class="col-md-4"><div class="card h-100 border-warning"><div class="card-body">'
                strFeedbackHtml += '<h4 class="h5 text-warning">Weaknesses</h4><ul>'
                objData.weaknesses.forEach((strItem) => { strFeedbackHtml += '<li>' + strItem + '</li>' })
                strFeedbackHtml += '</ul></div></div></div>'

                // Suggestions card
                strFeedbackHtml += '<div class="col-md-4"><div class="card h-100 border-primary"><div class="card-body">'
                strFeedbackHtml += '<h4 class="h5 text-primary">Suggestions</h4><ul>'
                objData.suggestions.forEach((strItem) => { strFeedbackHtml += '<li>' + strItem + '</li>' })
                strFeedbackHtml += '</ul></div></div></div>'

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

// init runs once on page load.  It resets all forms to a clean state
// and loads the dashboard counts so the user sees live numbers
// immediately without navigating anywhere.
const init = async () => {
    try {
        resetJobForm()
        resetSkillForm()
        resetAwardForm()
        resetCertificationForm()
        resetEducationForm()
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
