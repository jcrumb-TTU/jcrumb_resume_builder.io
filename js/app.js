// ============================================================
// This file was generated through a collaborative process
// combining Claude Sonnet 4.6 (Anthropic) and AI-assisted
// code generation tools across multiple development phases.
// Prompts used to produce this code were crafted using
// Claude Sonnet 4.6 and were designed to operate within
// the parameters covered in CSC 3100 during the Spring
// Semester of 2026, referencing the course AGENT.md
// conventions and class code examples developed throughout
// the semester. The author reviewed, oversaw, and approved
// all generated code prior to final commit and push to
// the project repository.
// ============================================================
// ============================================================
// CONSTANTS
// ============================================================

// Base URL for all fetch calls — must match HTTP_PORT in server.js
const strBaseUrl = 'http://localhost:3000'

// Mutable state: tracks which record is currently being edited
// in each section's form.  An empty string means "add mode".
let strEditingJobID = ''
let strEditingSkillID = ''
let strEditingAwardID = ''
let strEditingCertificationID = ''
let strEditingEducationID = ''

// In-memory array for responsibilities added before a new job is saved.
// The array is submitted to the API job-by-job after the job record is
// created so that each responsibility is tied to the correct strJobID.
let arrPendingResponsibilities = []

// ============================================================
// SECTION: Sidebar Toggle
// ============================================================

// Clicking the hamburger button collapses the sidebar to an icon-only
// strip (65px) or expands it back to full width (250px).
// The "toggled" class marks the collapsed state.
// All .sidebar-text spans are hidden in the collapsed state so only
// the FontAwesome icons remain visible.  No jQuery — vanilla JS only.
document.querySelector('#btnSidebarToggle').addEventListener('click', () => {
    const objSidebar = document.querySelector('#divSidebar')
    const blnIsCollapsed = objSidebar.classList.contains('toggled')

    if(blnIsCollapsed){
        // Expand sidebar back to full width
        objSidebar.classList.remove('toggled')
        objSidebar.style.width = '250px'
        document.querySelectorAll('.sidebar-text').forEach((objEl) => {
            objEl.classList.remove('d-none')
        })
    } else {
        // Collapse to icon-only strip
        objSidebar.classList.add('toggled')
        objSidebar.style.width = '65px'
        document.querySelectorAll('.sidebar-text').forEach((objEl) => {
            objEl.classList.add('d-none')
        })
    }
})

// ============================================================
// NAVIGATION
// ============================================================

// showSection hides every section then reveals only the requested one.
// It also updates the topbar breadcrumb label so the user always
// knows which section they are viewing.
const showSection = (strSectionID, strSectionLabel) => {
    // Complete list of section IDs — must stay in sync with index.html
    const arrSections = [
        '#divDashboard',
        '#divProfile',
        '#divEducation',
        '#divJobs',
        '#divSkills',
        '#divAwards',
        '#divCertifications',
        '#divResumeBuilder',
        '#divCredits'
    ]

    // Hide every section first
    arrSections.forEach((strSection) => {
        document.querySelector(strSection).classList.add('d-none')
    })

    // Reveal the requested section
    document.querySelector(strSectionID).classList.remove('d-none')

    // Update the topbar breadcrumb label
    document.querySelector('#spnCurrentSection').innerText = strSectionLabel

    // Highlight the active nav button — remove from all then set on the matching one
    const arrNavBtns = [
        '#btnNavDashboard', '#btnNavProfile', '#btnNavEducation', '#btnNavJobs',
        '#btnNavSkills', '#btnNavCertifications', '#btnNavAwards',
        '#btnNavResumeBuilder',
        '#btnNavCredits'
    ]
    arrNavBtns.forEach((strBtnID) => {
        const elBtn = document.querySelector(strBtnID)
        if(elBtn) elBtn.classList.remove('nav-active')
    })
    const objSectionNavMap = {
        '#divDashboard':     '#btnNavDashboard',
        '#divProfile':       '#btnNavProfile',
        '#divEducation':     '#btnNavEducation',
        '#divJobs':          '#btnNavJobs',
        '#divSkills':        '#btnNavSkills',
        '#divCertifications':'#btnNavCertifications',
        '#divAwards':        '#btnNavAwards',
        '#divResumeBuilder': '#btnNavResumeBuilder',
        '#divCredits':       '#btnNavCredits'
    }
    const strActiveBtn = objSectionNavMap[strSectionID]
    if(strActiveBtn){
        const elActive = document.querySelector(strActiveBtn)
        if(elActive) elActive.classList.add('nav-active')
    }
}

// ============================================================
// NAVBAR EVENT LISTENERS
// ============================================================

// Each sidebar button reveals its corresponding section and loads
// fresh data from the API.

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

document.querySelector('#btnNavCredits').addEventListener('click', () => {
    showSection('#divCredits', 'Credits & Acknowledgements')
})


// ============================================================
// SECTION: Dashboard
// ============================================================

// loadDashboard fetches all six resource collections in parallel and
// passes each array to its dedicated renderDashboard* function.
// Called on every btnNavDashboard click so the view is always current.
const loadDashboard = async () => {
    try {
        const [objProfileRes, objEduRes, objJobsRes, objSkillsRes, objCertsRes, objAwardsRes] = await Promise.all([
            fetch(`${strBaseUrl}/api/profile`),
            fetch(`${strBaseUrl}/api/education`),
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/certifications`),
            fetch(`${strBaseUrl}/api/awards`)
        ])

        if(
            objProfileRes.ok == false || objEduRes.ok == false || objJobsRes.ok == false ||
            objSkillsRes.ok == false  || objCertsRes.ok == false || objAwardsRes.ok == false
        ){
            throw new Error('Failed to load dashboard data')
        }

        const arrProfile = await objProfileRes.json()
        const arrEdu     = await objEduRes.json()
        const arrJobs    = await objJobsRes.json()
        const arrSkills  = await objSkillsRes.json()
        const arrCerts   = await objCertsRes.json()
        const arrAwards  = await objAwardsRes.json()

        renderDashboardProfile(arrProfile)
        renderDashboardEducation(arrEdu)
        renderDashboardJobs(arrJobs)
        renderDashboardSkills(arrSkills)
        renderDashboardCertifications(arrCerts)
        renderDashboardAwards(arrAwards)

    } catch(objError) {
        Swal.fire({title: "Error", text: "Failed to load dashboard data", icon: "error"})
    }
}

// renderDashboardProfile populates divDashProfile with the name header and
// three-column contact row matching the resume template layout.
const renderDashboardProfile = (arrProfile) => {
    const elCard = document.querySelector('#divDashProfile')
    if(arrProfile.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4 text-center text-muted fst-italic">
                No profile information added yet \u2014 click to set up your contact details
            </div>`
        return
    }
    const objP = arrProfile[0]
    const strLinkedIn = objP.strLinkedIn && objP.strLinkedIn.length > 0 ? `<div class="small">${objP.strLinkedIn}</div>` : ''
    const strGitHub   = objP.strGitHub   && objP.strGitHub.length   > 0 ? `<div class="small">${objP.strGitHub}</div>` : ''
    const strEmail    = objP.strEmail    && objP.strEmail.length    > 0 ? `<div class="small">${objP.strEmail}</div>` : ''
    const strPhone    = objP.strPhone    && objP.strPhone.length    > 0 ? `<div class="small">${objP.strPhone}</div>` : ''
    const strWebsite  = objP.strWebsite  && objP.strWebsite.length  > 0 ? `<div class="small">${objP.strWebsite}</div>` : ''
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fs-5 fw-bold text-center mb-2">${objP.strFullName}</p>
            <div class="row mb-1">
                <div class="col-4 text-start">${strLinkedIn}${strGitHub}</div>
                <div class="col-4 text-center">${strEmail}</div>
                <div class="col-4 text-end">${strPhone}${strWebsite}</div>
            </div>
            <hr class="my-1">
        </div>`
}

// renderDashboardEducation populates divDashEducation using the two-column
// date-left / institution-right layout from the resume template.
const renderDashboardEducation = (arrEdu) => {
    const elCard = document.querySelector('#divDashEducation')
    if(arrEdu.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4">
                <p class="fw-bold border-bottom pb-1 mb-2">Education</p>
                <p class="text-muted fst-italic mb-0">No education added yet \u2014 click to add your first entry</p>
            </div>`
        return
    }
    let strEntries = ''
    arrEdu.forEach((objEdu) => {
        const strEnd   = objEdu.strEndDate && objEdu.strEndDate.length > 0 ? objEdu.strEndDate : 'Present'
        const strField = objEdu.strFieldOfStudy && objEdu.strFieldOfStudy.length > 0 ? ` in ${objEdu.strFieldOfStudy}` : ''
        strEntries += `
            <div class="row mb-2">
                <div class="col-3"><small class="text-muted fst-italic">${strEnd}</small></div>
                <div class="col-9">
                    <span class="fw-bold small">${objEdu.strInstitutionName}</span>
                    <div class="small text-muted">${objEdu.strDegree}${strField}</div>
                </div>
            </div>`
    })
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fw-bold border-bottom pb-1 mb-2">Education</p>
            ${strEntries}
        </div>`
}

// renderDashboardJobs populates divDashJobs with role, company, date range,
// and responsibilities per the resume template two-column layout.
const renderDashboardJobs = (arrJobs) => {
    const elCard = document.querySelector('#divDashJobs')
    if(arrJobs.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4">
                <p class="fw-bold border-bottom pb-1 mb-2">Work Experience</p>
                <p class="text-muted fst-italic mb-0">No work experience added yet \u2014 click to add your first job</p>
            </div>`
        return
    }
    let strEntries = ''
    arrJobs.forEach((objJob) => {
        const strEnd      = objJob.strEndDate && objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'
        const strRange    = `${objJob.strStartDate || ''} \u2013 ${strEnd}`
        const arrResp     = objJob.arrResponsibilities || []
        const strRespHtml = arrResp.length > 0
            ? `<ul class="mb-0 ps-3">${arrResp.map((r) => `<li class="small">${r.strDescription}</li>`).join('')}</ul>`
            : ''
        strEntries += `
            <div class="row mb-3">
                <div class="col-3"><small class="text-muted fst-italic">${strRange}</small></div>
                <div class="col-9">
                    <span class="fw-bold small">${objJob.strRoleName}</span>
                    <span class="text-muted small ms-2">${objJob.strCompanyName}</span>
                    ${strRespHtml}
                </div>
            </div>`
    })
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fw-bold border-bottom pb-1 mb-2">Work Experience</p>
            ${strEntries}
        </div>`
}

// renderDashboardSkills populates divDashSkills with a comma-separated
// inline list of skill names matching the resume template skills line.
const renderDashboardSkills = (arrSkills) => {
    const elCard = document.querySelector('#divDashSkills')
    if(arrSkills.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4">
                <p class="fw-bold border-bottom pb-1 mb-2">Skills</p>
                <p class="text-muted fst-italic mb-0">No skills added yet \u2014 click to add your skills</p>
            </div>`
        return
    }
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fw-bold border-bottom pb-1 mb-2">Skills</p>
            <p class="mb-0 small">${arrSkills.map((s) => s.strSkillName).join(', ')}</p>
        </div>`
}

// renderDashboardCertifications populates divDashCertifications with name,
// organization, and date in the resume template certification format.
const renderDashboardCertifications = (arrCerts) => {
    const elCard = document.querySelector('#divDashCertifications')
    if(arrCerts.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4">
                <p class="fw-bold border-bottom pb-1 mb-2">Certifications</p>
                <p class="text-muted fst-italic mb-0">No certifications added yet \u2014 click to add your first certification</p>
            </div>`
        return
    }
    let strEntries = ''
    arrCerts.forEach((objCert) => {
        const strDate = objCert.strDateEarned && objCert.strDateEarned.length > 0
            ? `<small class="text-muted fst-italic ms-2">${objCert.strDateEarned}</small>` : ''
        strEntries += `
            <div class="mb-1 small">
                <span class="fw-bold">${objCert.strCertificationName}</span>
                <span class="text-muted ms-2">${objCert.strIssuingOrganization || ''}</span>
                ${strDate}
            </div>`
    })
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fw-bold border-bottom pb-1 mb-2">Certifications</p>
            ${strEntries}
        </div>`
}

// renderDashboardAwards populates divDashAwards with award name, date, and
// optional description per the resume template awards format.
const renderDashboardAwards = (arrAwards) => {
    const elCard = document.querySelector('#divDashAwards')
    if(arrAwards.length < 1){
        elCard.innerHTML = `
            <div class="card-body p-4">
                <p class="fw-bold border-bottom pb-1 mb-2">Awards</p>
                <p class="text-muted fst-italic mb-0">No awards added yet \u2014 click to add your first award</p>
            </div>`
        return
    }
    let strEntries = ''
    arrAwards.forEach((objAward) => {
        const strDate = objAward.strAwardDate && objAward.strAwardDate.length > 0
            ? `<small class="text-muted fst-italic ms-2">${objAward.strAwardDate}</small>` : ''
        const strDesc = objAward.strDescription && objAward.strDescription.length > 0
            ? `<div class="small text-muted">${objAward.strDescription}</div>` : ''
        strEntries += `
            <div class="mb-2 small">
                <span class="fw-bold">${objAward.strAwardName}</span>${strDate}
                ${strDesc}
            </div>`
    })
    elCard.innerHTML = `
        <div class="card-body p-4">
            <p class="fw-bold border-bottom pb-1 mb-2">Awards</p>
            ${strEntries}
        </div>`
}

// Click any dashboard card to navigate directly to that editing section.
// loadDashboard is re-called on every btnNavDashboard click, so the
// listeners only need to set up navigation — they never cache stale data.
document.querySelector('#divDashProfile').addEventListener('click', async () => {
    showSection('#divProfile', 'Profile')
    await loadProfile()
})
document.querySelector('#divDashEducation').addEventListener('click', async () => {
    showSection('#divEducation', 'Education')
    await loadEducation()
})
document.querySelector('#divDashJobs').addEventListener('click', async () => {
    showSection('#divJobs', 'Jobs')
    await loadJobs()
})
document.querySelector('#divDashSkills').addEventListener('click', async () => {
    showSection('#divSkills', 'Skills')
    await loadSkills()
})
document.querySelector('#divDashCertifications').addEventListener('click', async () => {
    showSection('#divCertifications', 'Certifications')
    await loadCertifications()
})
document.querySelector('#divDashAwards').addEventListener('click', async () => {
    showSection('#divAwards', 'Awards')
    await loadAwards()
})

// ============================================================
// SECTION: Dashboard Overlay Modals
// Each modal populates its content when it opens, then offers
// per-record Edit buttons and a bottom "Manage X" button that
// closes the modal and navigates directly to that section.
// ============================================================

// Helper: hide any open Bootstrap modal and fire a callback after it closes
const hideModalThen = (strModalID, fnCallback) => {
    const elModal   = document.querySelector(strModalID)
    const objModal  = bootstrap.Modal.getInstance(elModal)
    if(objModal){
        elModal.addEventListener('hidden.bs.modal', fnCallback, {once: true})
        objModal.hide()
    } else {
        fnCallback()
    }
}

// ---- Profile modal ----
document.querySelector('#modalProfile').addEventListener('show.bs.modal', async () => {
    try {
        const objRes     = await fetch(`${strBaseUrl}/api/profile`)
        const arrProfile = await objRes.json()
        const elContent  = document.querySelector('#divModalProfileContent')

        if(arrProfile.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No profile saved yet. Click "Edit Profile" to add one.</p>'
            return
        }

        const objP = arrProfile[0]
        const arrRows = [
            {label: 'Full Name',  value: objP.strFullName},
            {label: 'Email',      value: objP.strEmail},
            {label: 'Phone',      value: objP.strPhone},
            {label: 'LinkedIn',   value: objP.strLinkedIn},
            {label: 'GitHub',     value: objP.strGitHub},
            {label: 'Website',    value: objP.strWebsite}
        ].filter((objRow) => objRow.value && objRow.value.length > 0)

        elContent.innerHTML = arrRows.map((objRow) =>
            `<div class="d-flex py-2 border-bottom modal-record-row">
                <span class="text-muted me-3" style="min-width:110px">${objRow.label}</span>
                <span class="fw-semibold">${objRow.value}</span>
            </div>`
        ).join('') || '<p class="text-muted fst-italic">Profile is empty.</p>'

    } catch(objErr) {
        document.querySelector('#divModalProfileContent').innerHTML =
            '<p class="text-danger">Failed to load profile.</p>'
    }
})

document.querySelector('#btnModalGoProfile').addEventListener('click', () => {
    hideModalThen('#modalProfile', async () => {
        showSection('#divProfile', 'Profile')
        await loadProfile()
    })
})

// ---- Education modal ----
document.querySelector('#modalEducation').addEventListener('show.bs.modal', async () => {
    try {
        const objRes       = await fetch(`${strBaseUrl}/api/education`)
        const arrEducation = await objRes.json()
        const elContent    = document.querySelector('#divModalEducationContent')

        if(arrEducation.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No education records yet. Click "Manage Education" to add one.</p>'
            return
        }

        elContent.innerHTML = arrEducation.map((objEdu) => {
            const strEnd = objEdu.strEndDate && objEdu.strEndDate.length > 0 ? objEdu.strEndDate : 'Present'
            const strField = objEdu.strFieldOfStudy && objEdu.strFieldOfStudy.length > 0
                ? ` in ${objEdu.strFieldOfStudy}` : ''
            return `<div class="p-3 mb-3 border rounded modal-record-row">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <p class="fw-bold mb-1">${objEdu.strInstitutionName}</p>
                        <p class="mb-1">${objEdu.strDegree}${strField}</p>
                        <p class="text-muted small mb-0">${objEdu.strStartDate || ''} \u2013 ${strEnd}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-primary flex-shrink-0"
                            data-modal-edit-edu="${objEdu.strEducationID}"
                            type="button">Edit</button>
                </div>
            </div>`
        }).join('')

    } catch(objErr) {
        document.querySelector('#divModalEducationContent').innerHTML =
            '<p class="text-danger">Failed to load education records.</p>'
    }
})

document.querySelector('#divModalEducationContent').addEventListener('click', (objEvent) => {
    const objBtn = objEvent.target.closest('[data-modal-edit-edu]')
    if(!objBtn) return
    const strEduID = objBtn.getAttribute('data-modal-edit-edu')
    hideModalThen('#modalEducation', async () => {
        showSection('#divEducation', 'Education')
        await loadEducation()
        // Pre-populate the edit form
        const objRes = await fetch(`${strBaseUrl}/api/education`)
        const arrEdu = await objRes.json()
        const objEdu = arrEdu.find((e) => e.strEducationID === strEduID)
        if(objEdu){
            strEditingEducationID = objEdu.strEducationID
            document.querySelector('#txtInstitutionName').value = objEdu.strInstitutionName
            document.querySelector('#txtDegree').value          = objEdu.strDegree
            document.querySelector('#txtFieldOfStudy').value    = objEdu.strFieldOfStudy || ''
            document.querySelector('#txtEduStartDate').value    = objEdu.strStartDate || ''
            const blnAttending = !objEdu.strEndDate || objEdu.strEndDate.length < 1
            document.querySelector('#chkCurrentlyAttending').checked  = blnAttending
            document.querySelector('#txtEduEndDate').disabled         = blnAttending
            document.querySelector('#txtEduEndDate').value            = blnAttending ? '' : objEdu.strEndDate
            document.querySelector('#btnSaveEducation').innerText     = 'Update Education'
            document.querySelector('#btnCancelEditEducation').classList.remove('d-none')
        }
    })
})

document.querySelector('#btnModalGoEducation').addEventListener('click', () => {
    hideModalThen('#modalEducation', async () => {
        showSection('#divEducation', 'Education')
        await loadEducation()
    })
})

// ---- Jobs modal ----
document.querySelector('#modalJobs').addEventListener('show.bs.modal', async () => {
    try {
        const objRes    = await fetch(`${strBaseUrl}/api/jobs`)
        const arrJobs   = await objRes.json()
        const elContent = document.querySelector('#divModalJobsContent')

        if(arrJobs.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No jobs yet. Click "Manage Jobs" to add one.</p>'
            return
        }

        elContent.innerHTML = arrJobs.map((objJob) => {
            const strEnd = objJob.strEndDate && objJob.strEndDate.length > 0 ? objJob.strEndDate : 'Present'
            const arrResp = objJob.arrResponsibilities || []
            const strRespHtml = arrResp.length > 0
                ? `<ul class="mb-0 mt-2 small">${arrResp.map((r) => `<li>${r.strDescription}</li>`).join('')}</ul>`
                : ''
            return `<div class="p-3 mb-3 border rounded modal-record-row">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <p class="fw-bold mb-0">${objJob.strRoleName}</p>
                        <p class="text-muted mb-1">${objJob.strCompanyName}</p>
                        <p class="text-muted small mb-0">${objJob.strStartDate || ''} \u2013 ${strEnd}</p>
                        ${strRespHtml}
                    </div>
                    <button class="btn btn-sm btn-outline-primary flex-shrink-0"
                            data-modal-edit-job="${objJob.strJobID}"
                            type="button">Edit</button>
                </div>
            </div>`
        }).join('')

    } catch(objErr) {
        document.querySelector('#divModalJobsContent').innerHTML =
            '<p class="text-danger">Failed to load jobs.</p>'
    }
})

document.querySelector('#divModalJobsContent').addEventListener('click', (objEvent) => {
    const objBtn = objEvent.target.closest('[data-modal-edit-job]')
    if(!objBtn) return
    const strJobID = objBtn.getAttribute('data-modal-edit-job')
    hideModalThen('#modalJobs', async () => {
        showSection('#divJobs', 'Jobs')
        await loadJobs()
        const objRes  = await fetch(`${strBaseUrl}/api/jobs`)
        const arrJobs = await objRes.json()
        const objJob  = arrJobs.find((j) => j.strJobID === strJobID)
        if(objJob){
            strEditingJobID = objJob.strJobID
            document.querySelector('#txtRoleName').value    = objJob.strRoleName
            document.querySelector('#txtCompanyName').value = objJob.strCompanyName
            document.querySelector('#txtStartDate').value   = objJob.strStartDate || ''
            const blnWorking = !objJob.strEndDate || objJob.strEndDate.length < 1
            document.querySelector('#chkCurrentlyWorking').checked = blnWorking
            document.querySelector('#txtEndDate').disabled         = blnWorking
            document.querySelector('#txtEndDate').value            = blnWorking ? '' : objJob.strEndDate
            arrPendingResponsibilities = []
            renderResponsibilityPreview()
            document.querySelector('#btnSaveJob').innerText = 'Update Job'
            document.querySelector('#btnCancelEditJob').classList.remove('d-none')
        }
    })
})

document.querySelector('#btnModalGoJobs').addEventListener('click', () => {
    hideModalThen('#modalJobs', async () => {
        showSection('#divJobs', 'Jobs')
        await loadJobs()
    })
})

// ---- Skills modal ----
document.querySelector('#modalSkills').addEventListener('show.bs.modal', async () => {
    try {
        const objRes    = await fetch(`${strBaseUrl}/api/skills`)
        const arrSkills = await objRes.json()
        const elContent = document.querySelector('#divModalSkillsContent')

        if(arrSkills.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No skills yet. Click "Manage Skills" to add one.</p>'
            return
        }

        elContent.innerHTML = arrSkills.map((objSkill) =>
            `<div class="p-3 mb-2 border rounded modal-record-row d-flex justify-content-between align-items-center gap-3">
                <div>
                    <span class="fw-semibold">${objSkill.strSkillName}</span>
                    ${objSkill.strProficiencyLevel && objSkill.strProficiencyLevel.length > 0
                        ? `<span class="text-muted ms-2 small">\u2014 ${objSkill.strProficiencyLevel}</span>` : ''}
                </div>
                <button class="btn btn-sm btn-outline-primary flex-shrink-0"
                        data-modal-edit-skill="${objSkill.strSkillID}"
                        type="button">Edit</button>
            </div>`
        ).join('')

    } catch(objErr) {
        document.querySelector('#divModalSkillsContent').innerHTML =
            '<p class="text-danger">Failed to load skills.</p>'
    }
})

document.querySelector('#divModalSkillsContent').addEventListener('click', (objEvent) => {
    const objBtn = objEvent.target.closest('[data-modal-edit-skill]')
    if(!objBtn) return
    const strSkillID = objBtn.getAttribute('data-modal-edit-skill')
    hideModalThen('#modalSkills', async () => {
        showSection('#divSkills', 'Skills')
        await loadSkills()
        const objRes    = await fetch(`${strBaseUrl}/api/skills`)
        const arrSkills = await objRes.json()
        const objSkill  = arrSkills.find((s) => s.strSkillID === strSkillID)
        if(objSkill){
            strEditingSkillID = objSkill.strSkillID
            document.querySelector('#txtSkillName').value        = objSkill.strSkillName
            document.querySelector('#txtProficiencyLevel').value = objSkill.strProficiencyLevel || ''
            document.querySelector('#btnSaveSkill').innerText    = 'Update Skill'
            document.querySelector('#btnCancelEditSkill').classList.remove('d-none')
        }
    })
})

document.querySelector('#btnModalGoSkills').addEventListener('click', () => {
    hideModalThen('#modalSkills', async () => {
        showSection('#divSkills', 'Skills')
        await loadSkills()
    })
})

// ---- Certifications modal ----
document.querySelector('#modalCertifications').addEventListener('show.bs.modal', async () => {
    try {
        const objRes    = await fetch(`${strBaseUrl}/api/certifications`)
        const arrCerts  = await objRes.json()
        const elContent = document.querySelector('#divModalCertsContent')

        if(arrCerts.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No certifications yet. Click "Manage Certifications" to add one.</p>'
            return
        }

        elContent.innerHTML = arrCerts.map((objCert) =>
            `<div class="p-3 mb-2 border rounded modal-record-row d-flex justify-content-between align-items-center gap-3">
                <div>
                    <p class="fw-bold mb-0">${objCert.strCertificationName}</p>
                    <p class="text-muted small mb-0">
                        ${objCert.strIssuingOrganization || ''}
                        ${objCert.strDateEarned && objCert.strDateEarned.length > 0
                            ? ' \u00b7 ' + objCert.strDateEarned : ''}
                    </p>
                </div>
                <button class="btn btn-sm btn-outline-primary flex-shrink-0"
                        data-modal-edit-cert="${objCert.strCertificationID}"
                        type="button">Edit</button>
            </div>`
        ).join('')

    } catch(objErr) {
        document.querySelector('#divModalCertsContent').innerHTML =
            '<p class="text-danger">Failed to load certifications.</p>'
    }
})

document.querySelector('#divModalCertsContent').addEventListener('click', (objEvent) => {
    const objBtn = objEvent.target.closest('[data-modal-edit-cert]')
    if(!objBtn) return
    const strCertID = objBtn.getAttribute('data-modal-edit-cert')
    hideModalThen('#modalCertifications', async () => {
        showSection('#divCertifications', 'Certifications')
        await loadCertifications()
        const objRes   = await fetch(`${strBaseUrl}/api/certifications`)
        const arrCerts = await objRes.json()
        const objCert  = arrCerts.find((c) => c.strCertificationID === strCertID)
        if(objCert){
            strEditingCertificationID = objCert.strCertificationID
            document.querySelector('#txtCertificationName').value   = objCert.strCertificationName
            document.querySelector('#txtIssuingOrganization').value = objCert.strIssuingOrganization || ''
            document.querySelector('#txtDateEarned').value          = objCert.strDateEarned || ''
            document.querySelector('#btnSaveCertification').innerText = 'Update Certification'
            document.querySelector('#btnCancelEditCertification').classList.remove('d-none')
        }
    })
})

document.querySelector('#btnModalGoCerts').addEventListener('click', () => {
    hideModalThen('#modalCertifications', async () => {
        showSection('#divCertifications', 'Certifications')
        await loadCertifications()
    })
})

// ---- Awards modal ----
document.querySelector('#modalAwards').addEventListener('show.bs.modal', async () => {
    try {
        const objRes    = await fetch(`${strBaseUrl}/api/awards`)
        const arrAwards = await objRes.json()
        const elContent = document.querySelector('#divModalAwardsContent')

        if(arrAwards.length < 1){
            elContent.innerHTML = '<p class="text-muted fst-italic">No awards yet. Click "Manage Awards" to add one.</p>'
            return
        }

        elContent.innerHTML = arrAwards.map((objAward) =>
            `<div class="p-3 mb-2 border rounded modal-record-row d-flex justify-content-between align-items-center gap-3">
                <div>
                    <p class="fw-bold mb-0">${objAward.strAwardName}</p>
                    <p class="text-muted small mb-0">
                        ${objAward.strAwardDate && objAward.strAwardDate.length > 0
                            ? objAward.strAwardDate : ''}
                        ${objAward.strDescription && objAward.strDescription.length > 0
                            ? ' \u2014 ' + objAward.strDescription : ''}
                    </p>
                </div>
                <button class="btn btn-sm btn-outline-primary flex-shrink-0"
                        data-modal-edit-award="${objAward.strAwardID}"
                        type="button">Edit</button>
            </div>`
        ).join('')

    } catch(objErr) {
        document.querySelector('#divModalAwardsContent').innerHTML =
            '<p class="text-danger">Failed to load awards.</p>'
    }
})

document.querySelector('#divModalAwardsContent').addEventListener('click', (objEvent) => {
    const objBtn = objEvent.target.closest('[data-modal-edit-award]')
    if(!objBtn) return
    const strAwardID = objBtn.getAttribute('data-modal-edit-award')
    hideModalThen('#modalAwards', async () => {
        showSection('#divAwards', 'Awards')
        await loadAwards()
        const objRes    = await fetch(`${strBaseUrl}/api/awards`)
        const arrAwards = await objRes.json()
        const objAward  = arrAwards.find((a) => a.strAwardID === strAwardID)
        if(objAward){
            strEditingAwardID = objAward.strAwardID
            document.querySelector('#txtAwardName').value        = objAward.strAwardName
            document.querySelector('#txtAwardDate').value        = objAward.strAwardDate || ''
            document.querySelector('#txtAwardDescription').value = objAward.strDescription || ''
            document.querySelector('#btnSaveAward').innerText    = 'Update Award'
            document.querySelector('#btnCancelEditAward').classList.remove('d-none')
        }
    })
})

document.querySelector('#btnModalGoAwards').addEventListener('click', () => {
    hideModalThen('#modalAwards', async () => {
        showSection('#divAwards', 'Awards')
        await loadAwards()
    })
})

// ============================================================
// SECTION: Profile
// ============================================================

// loadProfile fetches the profile record and pre-populates the form
// when one already exists.  If the database has no profile yet the
// form stays blank and btnSaveProfile will call POST.
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

// resetEducationForm clears all education form fields, unchecks the
// currently-attending checkbox, re-enables the end date input, and
// returns the button label to its default state.
const resetEducationForm = () => {
    document.querySelector('#txtInstitutionName').value = ''
    document.querySelector('#txtDegree').value = ''
    document.querySelector('#txtFieldOfStudy').value = ''
    document.querySelector('#txtEduStartDate').value = ''
    document.querySelector('#txtEduEndDate').value = ''
    document.querySelector('#txtEduEndDate').disabled = false
    document.querySelector('#chkCurrentlyAttending').checked = false
    document.querySelector('#btnSaveEducation').innerText = 'Save Education'
    document.querySelector('#btnCancelEditEducation').classList.add('d-none')
    strEditingEducationID = ''
}

// chkCurrentlyAttending disables and clears txtEduEndDate when checked,
// re-enables it when unchecked.  Cards and resume output will display
// "Present" when strEndDate is empty.
document.querySelector('#chkCurrentlyAttending').addEventListener('change', () => {
    const objEndDate = document.querySelector('#txtEduEndDate')
    if(document.querySelector('#chkCurrentlyAttending').checked){
        objEndDate.value = ''
        objEndDate.disabled = true
    } else {
        objEndDate.disabled = false
    }
})

// loadEducation fetches all education records and renders them as cards
// in divEducationList.  An empty-state message is shown when none exist.
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
            // Display "Present" when the end date is absent
            const strDisplayEnd = objEducation.strEndDate && objEducation.strEndDate.length > 0
                ? objEducation.strEndDate
                : 'Present'

            // Show field of study only when one was provided
            const strFieldDisplay = objEducation.strFieldOfStudy && objEducation.strFieldOfStudy.length > 0
                ? ` \u2014 ${objEducation.strFieldOfStudy}`
                : ''

            document.querySelector('#divEducationList').innerHTML += `
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                            <div>
                                <h3 class="h5 mb-1">${objEducation.strInstitutionName}</h3>
                                <p class="mb-1">${objEducation.strDegree}${strFieldDisplay}</p>
                                <p class="text-muted mb-0">${objEducation.strStartDate || ''} \u2013 ${strDisplayEnd}</p>
                            </div>
                            <div class="flex-shrink-0">
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

    // Use empty string for end date when "currently attending" is checked
    const strEduEndDate = document.querySelector('#chkCurrentlyAttending').checked
        ? ''
        : document.querySelector('#txtEduEndDate').value.trim()

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
// button clicks created dynamically inside loadEducation().
document.querySelector('#divEducationList').addEventListener('click', async (objEvent) => {
    const objDeleteBtn = objEvent.target.closest('[id^="btnDeleteEducation_"]')
    const objEditBtn = objEvent.target.closest('[id^="btnEditEducation_"]')

    // ---- Delete education record (SweetAlert2 confirmation required) ----
    if(objDeleteBtn){
        const strEducationID = objDeleteBtn.id.replace('btnDeleteEducation_', '')

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

    // ---- Edit education record — populate the form and set checkbox state ----
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
                strEditingEducationID = objEducation.strEducationID
                document.querySelector('#txtInstitutionName').value = objEducation.strInstitutionName
                document.querySelector('#txtDegree').value = objEducation.strDegree
                document.querySelector('#txtFieldOfStudy').value = objEducation.strFieldOfStudy || ''
                document.querySelector('#txtEduStartDate').value = objEducation.strStartDate || ''

                // If end date is absent, check the "currently attending" checkbox
                // and disable the end date field — mirrors how the form behaves on input
                const blnCurrentlyAttending = !objEducation.strEndDate || objEducation.strEndDate.length < 1
                document.querySelector('#chkCurrentlyAttending').checked = blnCurrentlyAttending
                document.querySelector('#txtEduEndDate').disabled = blnCurrentlyAttending
                if(!blnCurrentlyAttending){
                    document.querySelector('#txtEduEndDate').value = objEducation.strEndDate
                } else {
                    document.querySelector('#txtEduEndDate').value = ''
                }

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

// resetJobForm clears all job form fields, unchecks the currently-working
// checkbox, re-enables the end date input, clears the pending
// responsibilities array, and returns the button label to its default state.
const resetJobForm = () => {
    document.querySelector('#txtRoleName').value = ''
    document.querySelector('#txtCompanyName').value = ''
    document.querySelector('#txtStartDate').value = ''
    document.querySelector('#txtEndDate').value = ''
    document.querySelector('#txtEndDate').disabled = false
    document.querySelector('#chkCurrentlyWorking').checked = false
    document.querySelector('#txtNewResponsibility').value = ''
    document.querySelector('#btnSaveJob').innerText = 'Save Job'
    document.querySelector('#btnCancelEditJob').classList.add('d-none')
    strEditingJobID = ''

    // Clear the in-memory responsibility array and re-render the empty preview
    arrPendingResponsibilities = []
    renderResponsibilityPreview()
}

// chkCurrentlyWorking disables and clears txtEndDate when checked,
// re-enables it when unchecked.  Cards and resume output will display
// "Present" when strEndDate is empty.
document.querySelector('#chkCurrentlyWorking').addEventListener('change', () => {
    const objEndDate = document.querySelector('#txtEndDate')
    if(document.querySelector('#chkCurrentlyWorking').checked){
        objEndDate.value = ''
        objEndDate.disabled = true
    } else {
        objEndDate.disabled = false
    }
})

// renderResponsibilityPreview rebuilds divResponsibilityPreview from
// arrPendingResponsibilities.  Each item gets its own remove button.
// Called after every add or remove action so the list stays in sync.
const renderResponsibilityPreview = () => {
    document.querySelector('#divResponsibilityPreview').innerHTML = ''
    arrPendingResponsibilities.forEach((strDesc, intIndex) => {
        document.querySelector('#divResponsibilityPreview').innerHTML += `
            <div class="d-flex align-items-center justify-content-between py-1 border-bottom">
                <span class="small">${strDesc}</span>
                <button class="btn btn-link btn-sm text-danger p-0"
                        type="button"
                        id="btnRemoveResp_${intIndex}"
                        aria-label="Remove responsibility from pending list">
                    <i class="fas fa-times"></i>
                </button>
            </div>`
    })
}

// Event delegation on divResponsibilityPreview for the individual remove
// buttons.  Clicking one removes its item from the in-memory array and
// re-renders the list.
document.querySelector('#divResponsibilityPreview').addEventListener('click', (objEvent) => {
    const objRemoveBtn = objEvent.target.closest('[id^="btnRemoveResp_"]')
    if(objRemoveBtn){
        const intIndex = parseInt(objRemoveBtn.id.replace('btnRemoveResp_', ''))
        arrPendingResponsibilities.splice(intIndex, 1)
        renderResponsibilityPreview()
    }
})

// btnAddResponsibility appends the typed description to arrPendingResponsibilities
// and refreshes divResponsibilityPreview so the user can see and remove it
// before the job is saved.
document.querySelector('#btnAddResponsibility').addEventListener('click', () => {
    const strDescription = document.querySelector('#txtNewResponsibility').value.trim()

    let blnError = false
    let strMessage = ''

    if(strDescription.length < 1){
        blnError = true
        strMessage += 'Please enter a responsibility.'
    }

    if(blnError == false){
        // Add to in-memory array and clear the input
        arrPendingResponsibilities.push(strDescription)
        document.querySelector('#txtNewResponsibility').value = ''
        renderResponsibilityPreview()
    } else {
        // Validation errors always surface through SweetAlert2
        Swal.fire({
            title: "Validation Error",
            text: strMessage,
            icon: "error"
        })
    }
})

// loadJobs fetches all jobs (with embedded responsibilities) and renders
// a card for each one.  The card shows the job details, its saved
// responsibilities with individual delete buttons, and no inline add form
// (new responsibilities are added via the pending-responsibilities flow
// in the top form before or during the save action).
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

        // Build one card per job with its saved responsibilities listed inside
        arrJobs.forEach((objJob) => {
            // Build HTML for existing saved responsibilities — each has a delete button
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

            // "Present" when end date is absent
            const strEndDateDisplay = objJob.strEndDate && objJob.strEndDate.length > 0
                ? objJob.strEndDate
                : 'Present'

            document.querySelector('#divJobsList').innerHTML += `
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                            <div>
                                <h3 class="h5 mb-1">${objJob.strRoleName}</h3>
                                <p class="mb-1">${objJob.strCompanyName}</p>
                                <p class="text-muted mb-0">
                                    ${objJob.strStartDate} \u2013 ${strEndDateDisplay}
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

                        ${strResponsibilitiesHtml.length > 0 ? `
                        <hr>
                        <h4 class="h6">Responsibilities</h4>
                        <ul class="list-group">
                            ${strResponsibilitiesHtml}
                        </ul>` : ''}
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

// btnSaveJob handles both creating a new job (POST) and updating an
// existing one (PUT) depending on strEditingJobID.
// After a successful POST it also submits each pending responsibility
// individually to /api/responsibilities so they are tied to the new job.
// For PUT it similarly submits any pending responsibilities using the
// existing strEditingJobID.
document.querySelector('#btnSaveJob').addEventListener('click', async () => {
    const strRoleName = document.querySelector('#txtRoleName').value.trim()
    const strCompanyName = document.querySelector('#txtCompanyName').value.trim()
    const strStartDate = document.querySelector('#txtStartDate').value.trim()

    // Use empty string for end date when "currently working here" is checked
    const strEndDate = document.querySelector('#chkCurrentlyWorking').checked
        ? ''
        : document.querySelector('#txtEndDate').value.trim()

    let blnError = false
    let strMessage = ''

    if(strRoleName.length < 1){ blnError = true; strMessage += 'You must provide a role name. ' }
    if(strCompanyName.length < 1){ blnError = true; strMessage += 'You must provide a company name. ' }
    if(strStartDate.length < 1){ blnError = true; strMessage += 'You must provide a start date. ' }

    if(blnError == false){
        try {
            const blnIsEditing = strEditingJobID.length > 0
            const strMethod = blnIsEditing ? 'PUT' : 'POST'

            const objPayload = blnIsEditing
                ? {strJobID: strEditingJobID, strRoleName, strCompanyName, strStartDate, strEndDate}
                : {strRoleName, strCompanyName, strStartDate, strEndDate}

            // Step 1: Create or update the job record
            const objJobResponse = await fetch(`${strBaseUrl}/api/jobs`, {
                method: strMethod,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(objPayload)
            })

            if(objJobResponse.ok == false){
                const objErrorData = await objJobResponse.json()
                throw new Error(objErrorData.errorMessage || objErrorData.message || objJobResponse.status)
            }

            // Determine the job ID to associate with pending responsibilities.
            // For POST, the new ID is returned in the response body.
            // For PUT, use the existing strEditingJobID.
            let strTargetJobID = ''
            if(blnIsEditing){
                strTargetJobID = strEditingJobID
            } else {
                const objJobData = await objJobResponse.json()
                strTargetJobID = objJobData.strJobID
            }

            // Step 2: Submit each pending responsibility individually
            for(const strDescription of arrPendingResponsibilities){
                await fetch(`${strBaseUrl}/api/responsibilities`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({strJobID: strTargetJobID, strDescription})
                })
            }

            // Step 3: Reset form and pending list, then reload the job list
            resetJobForm()

            Swal.fire({
                title: "Saved",
                text: blnIsEditing ? "Job updated successfully" : "Job saved successfully",
                icon: "success",
                timer: 1500
            })

            await loadJobs()

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

// Event delegation on divJobsList handles all dynamic button clicks for
// job edit/delete and responsibility delete.
// Responsibility delete is SILENT — no SweetAlert2 for success, error,
// or confirmation.  The list reload provides implicit visual feedback.
// Validation errors anywhere in this handler still use SweetAlert2.
document.querySelector('#divJobsList').addEventListener('click', async (objEvent) => {
    const objDeleteJobBtn = objEvent.target.closest('[id^="btnDelete_"]')
    const objEditJobBtn = objEvent.target.closest('[id^="btnEdit_"]')
    const objDeleteResponsibilityBtn = objEvent.target.closest('[id^="btnDeleteResponsibility_"]')

    // ---- Delete job (SweetAlert2 confirmation required) ----
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

    // ---- Edit job — populate the form and set checkbox state ----
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

                // If end date is absent, check the "currently working" checkbox
                // and disable the end date field
                const blnCurrentlyWorking = !objJob.strEndDate || objJob.strEndDate.length < 1
                document.querySelector('#chkCurrentlyWorking').checked = blnCurrentlyWorking
                document.querySelector('#txtEndDate').disabled = blnCurrentlyWorking
                if(!blnCurrentlyWorking){
                    document.querySelector('#txtEndDate').value = objJob.strEndDate
                } else {
                    document.querySelector('#txtEndDate').value = ''
                }

                // Clear any previously pending responsibilities when entering edit mode
                arrPendingResponsibilities = []
                renderResponsibilityPreview()

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

    // ---- Delete responsibility from existing saved job (SILENT) ----
    if(objDeleteResponsibilityBtn){
        const strResponsibilityID = objDeleteResponsibilityBtn.id.replace('btnDeleteResponsibility_', '')

        try {
            await fetch(`${strBaseUrl}/api/responsibilities/${strResponsibilityID}`, {
                method: 'DELETE'
            })
            // Silent reload — the disappearing item confirms the delete
            await loadJobs()
        } catch(objError) {
            // Silent catch — list reload provides the visual feedback
            console.error('Failed to delete responsibility:', objError.message)
        }
    }
})

// ============================================================
// SECTION: Skills
// ============================================================

// resetSkillForm clears inputs and returns the form to add mode.
const resetSkillForm = () => {
    document.querySelector('#txtSkillName').value = ''
    document.querySelector('#txtProficiencyLevel').value = ''
    document.querySelector('#btnSaveSkill').innerText = 'Save Skill'
    document.querySelector('#btnCancelEditSkill').classList.add('d-none')
    strEditingSkillID = ''
}

// loadSkills fetches and renders all skill cards.
// Success and error are SILENT — only validation errors use SweetAlert2.
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
        console.error('Failed to load skills:', objError.message)
    }
}

// btnSaveSkill handles POST and PUT.
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

// Event delegation on divSkillsList — delete and edit are SILENT.
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
            if(objResponse.ok == false) throw new Error('Failed to load skill for editing')
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

// loadAwards fetches and renders all award cards — SILENT.
const loadAwards = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/awards`)
        if(objResponse.ok == false) throw new Error('Failed to load awards')
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

// btnSaveAward — SILENT success/error; validation uses Swal.
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

// Event delegation on divAwardsList — SILENT.
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
            if(objResponse.ok == false) throw new Error('Failed to load award for editing')
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

// resetCertificationForm clears inputs and returns the form to add mode.
const resetCertificationForm = () => {
    document.querySelector('#txtCertificationName').value = ''
    document.querySelector('#txtIssuingOrganization').value = ''
    document.querySelector('#txtDateEarned').value = ''
    document.querySelector('#btnSaveCertification').innerText = 'Save Certification'
    document.querySelector('#btnCancelEditCertification').classList.add('d-none')
    strEditingCertificationID = ''
}

// loadCertifications fetches and renders all certification cards — SILENT.
const loadCertifications = async () => {
    try {
        const objResponse = await fetch(`${strBaseUrl}/api/certifications`)
        if(objResponse.ok == false) throw new Error('Failed to load certifications')
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
            if(objResponse.ok == false) throw new Error('Failed to load certification for editing')
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
// SECTION: PDF Export
// ============================================================

// generateResumePDF
// Fetches all resume data, builds a jsPDF document matching
// the Crumb_Resume.pdf template, and triggers a browser
// download. ALL fetch calls must use strBaseUrl — bare
// relative paths will resolve against file:// and fail.
const generateResumePDF = async () => {
    try {
        // Step 1: Fetch all resume data in parallel.
        // strBaseUrl is REQUIRED on every fetch call here.
        // Bare paths like '/api/profile' will fail under loadFile.
        const [objProfile, objEducation, objJobs, objSkills, objCerts, objAwards] = await Promise.all([
            fetch(`${strBaseUrl}/api/profile`),
            fetch(`${strBaseUrl}/api/education`),
            fetch(`${strBaseUrl}/api/jobs`),
            fetch(`${strBaseUrl}/api/skills`),
            fetch(`${strBaseUrl}/api/certifications`),
            fetch(`${strBaseUrl}/api/awards`)
        ])

        const arrProfile   = await objProfile.json()
        const arrEducation = await objEducation.json()
        const arrJobs      = await objJobs.json()
        const arrSkills    = await objSkills.json()
        const arrCerts     = await objCerts.json()
        const arrAwards    = await objAwards.json()

        // Step 2: Instantiate jsPDF
        const { jsPDF } = window.jspdf
        const objPDF = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'})

        const intPageWidth   = 210
        const intPageHeight  = 297
        const intMargin      = 15
        const intContentWidth  = intPageWidth - (intMargin * 2)
        const intLeftColWidth  = intContentWidth * 0.25
        const intRightColWidth = intContentWidth * 0.75
        const intRightColX   = intMargin + intLeftColWidth
        let intY = intMargin

        // checkPageBreak adds a new page if the next block of
        // content would overflow the bottom margin
        const checkPageBreak = (intNeeded) => {
            if(intY + intNeeded > intPageHeight - intMargin){
                objPDF.addPage()
                intY = intMargin
            }
        }

        // Step 3: Profile header
        if(arrProfile.length > 0){
            const objP = arrProfile[0]

            objPDF.setFont('helvetica', 'bold')
            objPDF.setFontSize(16)
            objPDF.text(objP.strFullName || '', intPageWidth / 2, intY, {align: 'center'})
            intY += 7

            objPDF.setFont('helvetica', 'normal')
            objPDF.setFontSize(9)

            const strLeft   = [objP.strLinkedIn, objP.strGitHub].filter(Boolean).join('\n')
            const strCenter = objP.strEmail || ''
            const strRight  = [objP.strPhone, objP.strWebsite].filter(Boolean).join('\n')
            const intContactLines = Math.max(
                strLeft.split('\n').length,
                strCenter.split('\n').length,
                strRight.split('\n').length
            )

            if(strLeft)   objPDF.text(strLeft,   intMargin,                intY)
            if(strCenter) objPDF.text(strCenter, intPageWidth / 2,         intY, {align: 'center'})
            if(strRight)  objPDF.text(strRight,  intPageWidth - intMargin, intY, {align: 'right'})
            intY += (intContactLines * 4) + 3

            objPDF.setLineWidth(0.3)
            objPDF.line(intMargin, intY, intPageWidth - intMargin, intY)
            intY += 4
        }

        // Step 4: Education section
        if(arrEducation.length > 0){
            let blnEduHeaderDrawn = false
            arrEducation.forEach((objEdu) => {
                checkPageBreak(20)

                if(!blnEduHeaderDrawn){
                    objPDF.setFont('helvetica', 'bold')
                    objPDF.setFontSize(10)
                    objPDF.text('Education', intMargin, intY)
                    blnEduHeaderDrawn = true
                }

                const strEndDisplay = objEdu.strEndDate && objEdu.strEndDate.length > 0
                    ? objEdu.strEndDate : 'Present'

                objPDF.setFont('helvetica', 'italic')
                objPDF.setFontSize(9)
                objPDF.text(strEndDisplay, intMargin, intY + 5)

                objPDF.setFont('helvetica', 'bold')
                objPDF.setFontSize(10)
                objPDF.text(objEdu.strInstitutionName || '', intRightColX, intY)

                objPDF.setFont('helvetica', 'normal')
                objPDF.setFontSize(9)
                const strDegreeText = [objEdu.strDegree, objEdu.strFieldOfStudy]
                    .filter(Boolean).join(' in ')
                objPDF.text(strDegreeText, intRightColX, intY + 5)
                intY += 13
            })
            intY += 2
        }

        // Step 5: Work Experience section
        if(arrJobs.length > 0){
            let blnJobHeaderDrawn = false
            arrJobs.forEach((objJob) => {
                checkPageBreak(25)

                const strEndDisplay = objJob.strEndDate && objJob.strEndDate.length > 0
                    ? objJob.strEndDate : 'Present'

                if(!blnJobHeaderDrawn){
                    objPDF.setFont('helvetica', 'bold')
                    objPDF.setFontSize(10)
                    objPDF.text('Work Experience', intMargin, intY)
                    blnJobHeaderDrawn = true
                }

                objPDF.setFont('helvetica', 'italic')
                objPDF.setFontSize(9)
                objPDF.text(`${objJob.strStartDate} - ${strEndDisplay}`, intMargin, intY + 5)

                objPDF.setFont('helvetica', 'bold')
                objPDF.setFontSize(10)
                objPDF.text(objJob.strRoleName || '', intRightColX, intY)

                objPDF.setFont('helvetica', 'normal')
                objPDF.setFontSize(9)
                objPDF.text(objJob.strCompanyName || '', intRightColX, intY + 5)
                intY += 11

                // Responsibilities as dash-prefixed bullet lines
                if(objJob.arrResponsibilities && objJob.arrResponsibilities.length > 0){
                    objJob.arrResponsibilities.forEach((objResp) => {
                        const arrLines = objPDF.splitTextToSize(
                            `- ${objResp.strDescription}`,
                            intRightColWidth - 5
                        )
                        checkPageBreak(arrLines.length * 4 + 2)
                        objPDF.text(arrLines, intRightColX + 3, intY)
                        intY += (arrLines.length * 4) + 1
                    })
                }
                intY += 3
            })
            intY += 2
        }

        // Step 6: Skills section
        if(arrSkills.length > 0){
            checkPageBreak(15)
            objPDF.setFont('helvetica', 'bold')
            objPDF.setFontSize(10)
            objPDF.text('Skills', intMargin, intY)

            objPDF.setFont('helvetica', 'normal')
            objPDF.setFontSize(9)
            const strSkillsLine = arrSkills.map(objSkill => objSkill.strSkillName).join(', ')
            const arrSkillLines = objPDF.splitTextToSize(strSkillsLine, intRightColWidth)
            objPDF.text(arrSkillLines, intRightColX, intY)
            intY += (arrSkillLines.length * 4) + 4
        }

        // Step 7: Certifications section
        if(arrCerts.length > 0){
            let blnCertHeaderDrawn = false
            arrCerts.forEach((objCert) => {
                checkPageBreak(12)

                if(!blnCertHeaderDrawn){
                    objPDF.setFont('helvetica', 'bold')
                    objPDF.setFontSize(10)
                    objPDF.text('Certifications', intMargin, intY)
                    blnCertHeaderDrawn = true
                }

                if(objCert.strDateEarned && objCert.strDateEarned.length > 0){
                    objPDF.setFont('helvetica', 'italic')
                    objPDF.setFontSize(9)
                    objPDF.text(objCert.strDateEarned, intMargin, intY + 5)
                }

                objPDF.setFont('helvetica', 'bold')
                objPDF.setFontSize(9)
                objPDF.text(objCert.strCertificationName || '', intRightColX, intY)

                objPDF.setFont('helvetica', 'normal')
                objPDF.setFontSize(9)
                if(objCert.strIssuingOrganization){
                    objPDF.text(objCert.strIssuingOrganization, intRightColX, intY + 5)
                }
                intY += 11
            })
            intY += 2
        }

        // Step 8: Awards section
        if(arrAwards.length > 0){
            let blnAwardHeaderDrawn = false
            arrAwards.forEach((objAward) => {
                checkPageBreak(15)

                if(!blnAwardHeaderDrawn){
                    objPDF.setFont('helvetica', 'bold')
                    objPDF.setFontSize(10)
                    objPDF.text('Awards', intMargin, intY)
                    blnAwardHeaderDrawn = true
                }

                if(objAward.strAwardDate && objAward.strAwardDate.length > 0){
                    objPDF.setFont('helvetica', 'italic')
                    objPDF.setFontSize(9)
                    objPDF.text(objAward.strAwardDate, intMargin, intY + 5)
                }

                objPDF.setFont('helvetica', 'bold')
                objPDF.setFontSize(9)
                objPDF.text(objAward.strAwardName || '', intRightColX, intY)

                if(objAward.strDescription && objAward.strDescription.length > 0){
                    objPDF.setFont('helvetica', 'normal')
                    objPDF.setFontSize(9)
                    const arrDescLines = objPDF.splitTextToSize(
                        objAward.strDescription,
                        intRightColWidth
                    )
                    checkPageBreak(arrDescLines.length * 4 + 2)
                    objPDF.text(arrDescLines, intRightColX, intY + 5)
                    intY += (arrDescLines.length * 4) + 3
                } else {
                    intY += 8
                }
                intY += 3
            })
        }

        // Step 9: Trigger download
        objPDF.save('resume.pdf')

    } catch(objError) {
        Swal.fire({
            title: "Export Failed",
            text:  "Could not generate PDF. Please try again.",
            icon:  "error"
        })
    }
}

// btnExportPDF — export the complete resume as a PDF document.
// generateResumePDF fetches all six data sources independently so
// the export is never gated on the resume builder checkbox selections.
document.querySelector('#btnExportPDF').addEventListener('click', async () => {
    await generateResumePDF()
})

// ============================================================
// SECTION: Resume Builder
// ============================================================

// loadResumeBuilder fetches all six data sources and builds the
// selection panel with checkboxes for every resume item.
// Profile information is always included when present — no checkbox
// is shown for profile in the selection UI.
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

        // Profile is silently included in the generated resume — no notice shown.

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

// btnPreviewResume assembles the preview HTML from all checked items plus
// the profile (always included if present).
// Resume sections render in this exact order per spec:
//   1. Profile contact information
//   2. Education
//   3. Work Experience and responsibilities
//   4. Certifications
//   5. Skills
//   6. Awards
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

            // ---- 1. Profile section (always shown when present) ----
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

            // ---- 2. Education section ----
            const arrSelectedEducation = arrEducation.filter(
                (objEdu) => arrSelectedEducationIDs.includes(objEdu.strEducationID)
            )

            if(arrSelectedEducation.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Education</h4>'
                arrSelectedEducation.forEach((objEdu) => {
                    const strFieldDisplay = objEdu.strFieldOfStudy && objEdu.strFieldOfStudy.length > 0
                        ? ' in ' + objEdu.strFieldOfStudy
                        : ''
                    const strEduEnd = objEdu.strEndDate && objEdu.strEndDate.length > 0
                        ? objEdu.strEndDate
                        : 'Present'
                    strPreviewHtml += '<div class="mb-3">'
                    strPreviewHtml += '<p class="fw-bold mb-1">' + objEdu.strInstitutionName + '</p>'
                    strPreviewHtml += '<p class="mb-1">' + objEdu.strDegree + strFieldDisplay + '</p>'
                    strPreviewHtml += '<p class="text-muted mb-0">' + (objEdu.strStartDate || '') + ' \u2013 ' + strEduEnd + '</p>'
                    strPreviewHtml += '</div>'
                })
                strPreviewHtml += '</section>'
            }

            // ---- 3. Work Experience section ----
            // Include a job when its checkbox is checked OR at least one of its
            // responsibilities is checked.
            const arrSelectedJobs = arrJobs.filter((objJob) => {
                const blnJobChecked = arrSelectedJobIDs.includes(objJob.strJobID)
                const blnHasCheckedResponsibility = objJob.arrResponsibilities.some(
                    (objR) => arrSelectedResponsibilityIDs.includes(objR.strResponsibilityID)
                )
                return blnJobChecked || blnHasCheckedResponsibility
            })

            if(arrSelectedJobs.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Work Experience</h4>'
                arrSelectedJobs.forEach((objJob) => {
                    let strResponsibilityHtml = ''
                    objJob.arrResponsibilities
                        .filter((objR) => arrSelectedResponsibilityIDs.includes(objR.strResponsibilityID))
                        .forEach((objR) => {
                            strResponsibilityHtml += '<li>' + objR.strDescription + '</li>'
                        })

                    const strJobEnd = objJob.strEndDate && objJob.strEndDate.length > 0
                        ? objJob.strEndDate
                        : 'Present'
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

            // ---- 4. Certifications section ----
            const arrSelectedCertifications = arrCertifications.filter(
                (objCertification) => arrSelectedCertificationIDs.includes(objCertification.strCertificationID)
            )

            if(arrSelectedCertifications.length > 0){
                strPreviewHtml += '<section class="mb-4"><h4 class="h5 border-bottom pb-2">Certifications</h4><ul>'
                arrSelectedCertifications.forEach((objCertification) => {
                    const strCertDate = objCertification.strDateEarned && objCertification.strDateEarned.length > 0
                        ? ' (' + objCertification.strDateEarned + ')'
                        : ''
                    strPreviewHtml += '<li>' + objCertification.strCertificationName + ' \u2014 ' + objCertification.strIssuingOrganization + strCertDate + '</li>'
                })
                strPreviewHtml += '</ul></section>'
            }

            // ---- 5. Skills section ----
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

            // ---- 6. Awards section ----
            const arrSelectedAwards = arrAwards.filter(
                (objAward) => arrSelectedAwardIDs.includes(objAward.strAwardID)
            )

            if(arrSelectedAwards.length > 0){
                strPreviewHtml += '<section class="mb-0"><h4 class="h5 border-bottom pb-2">Awards</h4><ul>'
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
// via the local /api/gemini route and renders the returned strengths /
// weaknesses / suggestions feedback cards.
// Gemini 429 rate-limit errors and all other errors surface via SweetAlert2.
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
// SECTION: Credits
// ============================================================

// The credits section is purely static HTML rendered by index.html.
// No load function or fetch calls are required — the content is
// always present in the DOM and simply shown/hidden by showSection.

// ============================================================
// INITIALIZATION
// ============================================================

// init runs once on page load.  It resets all forms to a clean state
// and loads the dashboard so the user sees live counts immediately
// without navigating anywhere.
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

// ============================================================
// This file was generated through a collaborative process
// combining Claude Sonnet 4.6 (Anthropic) and AI-assisted
// code generation tools across multiple development phases.
// Prompts used to produce this code were crafted using
// Claude Sonnet 4.6 and were designed to operate within
// the parameters covered in CSC 3100 during the Spring
// Semester of 2026, referencing the course AGENT.md
// conventions and class code examples developed throughout
// the semester. The author reviewed, oversaw, and approved
// all generated code prior to final commit and push to
// the project repository.
// ============================================================
