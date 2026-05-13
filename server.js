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
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const {v4: uuidv4} = require('uuid')
const dotenv = require('dotenv')

dotenv.config({quiet: true})

const HTTP_PORT = 3000
const app = express()

const getTrimmedString = (objValue) => {
    let strValue = ''

    if(typeof objValue === 'string'){
        strValue = objValue.trim()
    }

    return strValue
}

// ============================================================
// SECTION: Middleware Setup
// ============================================================
app.use(express.json())

// ============================================================
// SECTION: Database Setup
// ============================================================
let dbResume = null

const objDatabaseReadyPromise = new Promise((resolve, reject) => {
    dbResume = new sqlite3.Database('resume.db', (err) => {
        if(err){
            console.error("Error opening database:", err.message)
            reject(err)
        } else {
            console.log("Connected to resume.db")

            // CREATE TABLE IF NOT EXISTS makes these safe to run
            // on every startup because SQLite only creates each
            // table once when it does not already exist.
            dbResume.serialize(() => {
                dbResume.run(`CREATE TABLE IF NOT EXISTS tblJobs (
                    strJobID TEXT PRIMARY KEY,
                    strRoleName TEXT NOT NULL,
                    strCompanyName TEXT NOT NULL,
                    strStartDate TEXT NOT NULL,
                    strEndDate TEXT,
                    strLocation TEXT,
                    strDepartment TEXT
                )`)

                dbResume.run(`CREATE TABLE IF NOT EXISTS tblResponsibilities (
                    strResponsibilityID TEXT PRIMARY KEY,
                    strJobID TEXT NOT NULL,
                    strDescription TEXT NOT NULL,
                    FOREIGN KEY (strJobID) REFERENCES tblJobs(strJobID)
                )`)

                dbResume.run(`CREATE TABLE IF NOT EXISTS tblSkills (
                    strSkillID TEXT PRIMARY KEY,
                    strSkillName TEXT NOT NULL,
                    strProficiencyLevel TEXT
                )`)

                dbResume.run(`CREATE TABLE IF NOT EXISTS tblAwards (
                    strAwardID TEXT PRIMARY KEY,
                    strAwardName TEXT NOT NULL,
                    strAwardDate TEXT,
                    strDescription TEXT
                )`)

                dbResume.run(`CREATE TABLE IF NOT EXISTS tblCertifications (
                    strCertificationID TEXT PRIMARY KEY,
                    strCertificationName TEXT NOT NULL,
                    strIssuingOrganization TEXT NOT NULL,
                    strDateEarned TEXT
                )`)

                // tblProfile stores a single record for the user's personal
                // contact information.  There is no DELETE route for profile —
                // it is only ever created once and then updated in place.
                dbResume.run(`CREATE TABLE IF NOT EXISTS tblProfile (
                    strProfileID TEXT PRIMARY KEY,
                    strFullName TEXT NOT NULL,
                    strPhone TEXT,
                    strEmail TEXT,
                    strLinkedIn TEXT,
                    strGitHub TEXT,
                    strCity TEXT
                )`)


                // tblEducation is the LAST table created inside serialize().
                // Its callback resolves objDatabaseReadyPromise and unblocks
                // server startup.  All tables above must be created first.

                // --------------------------------------------------------
                // ALTER TABLE statements add new columns to existing tables.
                // These run every startup but are safe because the error
                // handler ignores 'duplicate column' errors exclusively.
                // Any other error is logged so genuine failures are visible.
                // --------------------------------------------------------
                dbResume.run(`ALTER TABLE tblJobs ADD COLUMN strLocation TEXT`, [], function(objErr){
                    if(objErr && !objErr.message.includes('duplicate column')){
                        console.error('ALTER tblJobs strLocation:', objErr.message)
                    }
                })

                dbResume.run(`ALTER TABLE tblJobs ADD COLUMN strDepartment TEXT`, [], function(objErr){
                    if(objErr && !objErr.message.includes('duplicate column')){
                        console.error('ALTER tblJobs strDepartment:', objErr.message)
                    }
                })

                dbResume.run(`ALTER TABLE tblEducation ADD COLUMN strLocation TEXT`, [], function(objErr){
                    if(objErr && !objErr.message.includes('duplicate column')){
                        console.error('ALTER tblEducation strLocation:', objErr.message)
                    }
                })

                dbResume.run(`ALTER TABLE tblProfile ADD COLUMN strCity TEXT`, [], function(objErr){
                    if(objErr && !objErr.message.includes('duplicate column')){
                        console.error('ALTER tblProfile strCity:', objErr.message)
                    }
                })

                // Migrate existing strWebsite data into strCity for all profile
                // records created before this column was added. Runs safely
                // on every startup — WHERE strCity IS NULL ensures it only
                // touches records that have not yet been migrated.
                dbResume.run(`UPDATE tblProfile SET strCity = strWebsite WHERE strCity IS NULL AND strWebsite IS NOT NULL`, [], function(objErr){
                    if(objErr){ console.error('Profile city migration:', objErr.message) }
                })

                dbResume.run(`CREATE TABLE IF NOT EXISTS tblEducation (
                    strEducationID TEXT PRIMARY KEY,
                    strInstitutionName TEXT NOT NULL,
                    strDegree TEXT NOT NULL,
                    strFieldOfStudy TEXT,
                    strStartDate TEXT,
                    strEndDate TEXT,
                    strLocation TEXT
                )`, [], function(objTableError){
                    if(objTableError){
                        reject(objTableError)
                    } else {
                        resolve()
                    }
                })
            })
        }
    })
})

// ============================================================
// SECTION: Jobs Routes
// ============================================================
app.get('/api/jobs', (req, res) => {
    const strQuery = `
        SELECT
            tblJobs.strJobID,
            tblJobs.strRoleName,
            tblJobs.strCompanyName,
            tblJobs.strStartDate,
            tblJobs.strEndDate,
            tblJobs.strLocation,
            tblJobs.strDepartment,
            tblResponsibilities.strResponsibilityID,
            tblResponsibilities.strDescription
        FROM tblJobs
        LEFT JOIN tblResponsibilities
            ON tblJobs.strJobID = tblResponsibilities.strJobID
        ORDER BY tblJobs.strStartDate DESC, tblResponsibilities.rowid ASC
    `

    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            const objJobsMap = {}
            const arrJobs = []

            rows.forEach((objRow) => {
                if(!objJobsMap[objRow.strJobID]){
                    objJobsMap[objRow.strJobID] = {
                        strJobID: objRow.strJobID,
                        strRoleName: objRow.strRoleName,
                        strCompanyName: objRow.strCompanyName,
                        strStartDate: objRow.strStartDate,
                        strEndDate: objRow.strEndDate,
                        strLocation: objRow.strLocation || '',
                        strDepartment: objRow.strDepartment || '',
                        arrResponsibilities: []
                    }
                    arrJobs.push(objJobsMap[objRow.strJobID])
                }

                if(objRow.strResponsibilityID){
                    objJobsMap[objRow.strJobID].arrResponsibilities.push({
                        strResponsibilityID: objRow.strResponsibilityID,
                        strJobID: objRow.strJobID,
                        strDescription: objRow.strDescription
                    })
                }
            })

            res.status(200).json(arrJobs)
        }
    })
})

app.post('/api/jobs', (req, res) => {
    let strRoleName = getTrimmedString(req.body.strRoleName)
    let strCompanyName = getTrimmedString(req.body.strCompanyName)
    let strStartDate = getTrimmedString(req.body.strStartDate)
    let strEndDate = getTrimmedString(req.body.strEndDate)
    let strLocation = getTrimmedString(req.body.strLocation)
    let strDepartment = getTrimmedString(req.body.strDepartment)

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
        const strJobID = uuidv4()
        const strQuery = "INSERT INTO tblJobs VALUES (?,?,?,?,?,?,?)"
        dbResume.run(strQuery, [strJobID, strRoleName, strCompanyName, strStartDate, strEndDate, strLocation, strDepartment], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Job created with id ${strJobID}`, strJobID: strJobID})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.put('/api/jobs', (req, res) => {
    let strJobID = getTrimmedString(req.body.strJobID)
    let strRoleName = getTrimmedString(req.body.strRoleName)
    let strCompanyName = getTrimmedString(req.body.strCompanyName)
    let strStartDate = getTrimmedString(req.body.strStartDate)
    let strEndDate = getTrimmedString(req.body.strEndDate)
    let strLocation = getTrimmedString(req.body.strLocation)
    let strDepartment = getTrimmedString(req.body.strDepartment)

    let blnError = false
    let strMessage = ''

    if(strJobID.length < 1){
        blnError = true
        strMessage += 'You must provide a job id. '
    }
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
        const strQuery = "UPDATE tblJobs SET strRoleName = ?, strCompanyName = ?, strStartDate = ?, strEndDate = ?, strLocation = ?, strDepartment = ? WHERE strJobID = ?"
        dbResume.run(strQuery, [strRoleName, strCompanyName, strStartDate, strEndDate, strLocation, strDepartment, strJobID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Job updated with id ${strJobID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.delete('/api/jobs/:jobid', (req, res) => {
    let strJobID = req.params.jobid

    let blnError = false
    let strMessage = ''

    if(strJobID.length < 1){
        blnError = true
        strMessage += 'You must provide a job id. '
    }

    if(blnError == false){
        const strDeleteResponsibilitiesQuery = "DELETE FROM tblResponsibilities WHERE strJobID = ?"
        dbResume.run(strDeleteResponsibilitiesQuery, [strJobID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                const strDeleteJobQuery = "DELETE FROM tblJobs WHERE strJobID = ?"
                dbResume.run(strDeleteJobQuery, [strJobID], function(objDeleteError){
                    if(objDeleteError){
                        res.status(500).json({outcome: "error", message: objDeleteError.message})
                    } else {
                        res.status(200).json({outcome: "success", message: `Job deleted with id ${strJobID}`})
                    }
                })
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// ============================================================
// SECTION: Responsibilities Routes
// ============================================================
app.get('/api/responsibilities', (req, res) => {
    let strJobID = req.query.jobid

    let blnError = false
    let strMessage = ''

    if(!strJobID || strJobID.trim().length < 1){
        blnError = true
        strMessage += 'You must provide a job id.'
    }

    if(blnError == false){
        const strQuery = "SELECT * FROM tblResponsibilities WHERE strJobID = ?"
        dbResume.all(strQuery, [strJobID], function(err, rows){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json(rows)
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

app.post('/api/responsibilities', (req, res) => {
    let strJobID = getTrimmedString(req.body.strJobID)
    let strDescription = getTrimmedString(req.body.strDescription)

    let blnError = false
    let strMessage = ''

    if(strJobID.length < 1){
        blnError = true
        strMessage += 'You must provide a job id. '
    }
    if(strDescription.length < 1){
        blnError = true
        strMessage += 'You must provide a responsibility description. '
    }

    if(blnError == false){
        const strResponsibilityID = uuidv4()
        const strQuery = "INSERT INTO tblResponsibilities VALUES (?,?,?)"
        dbResume.run(strQuery, [strResponsibilityID, strJobID, strDescription], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Responsibility created with id ${strResponsibilityID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.delete('/api/responsibilities/:responsibilityid', (req, res) => {
    let strResponsibilityID = req.params.responsibilityid

    let blnError = false
    let strMessage = ''

    if(strResponsibilityID.length < 1){
        blnError = true
        strMessage += 'You must provide a responsibility id.'
    }

    if(blnError == false){
        const strQuery = "DELETE FROM tblResponsibilities WHERE strResponsibilityID = ?"
        dbResume.run(strQuery, [strResponsibilityID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Responsibility deleted with id ${strResponsibilityID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

// ============================================================
// SECTION: Skills Routes
// ============================================================
app.get('/api/skills', (req, res) => {
    const strQuery = "SELECT * FROM tblSkills ORDER BY strSkillName ASC"
    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            res.status(200).json(rows)
        }
    })
})

app.post('/api/skills', (req, res) => {
    let strSkillName = getTrimmedString(req.body.strSkillName)
    let strProficiencyLevel = getTrimmedString(req.body.strProficiencyLevel)

    let blnError = false
    let strMessage = ''

    if(strSkillName.length < 1){
        blnError = true
        strMessage += 'You must provide a skill name. '
    }

    if(blnError == false){
        const strSkillID = uuidv4()
        const strQuery = "INSERT INTO tblSkills VALUES (?,?,?)"
        dbResume.run(strQuery, [strSkillID, strSkillName, strProficiencyLevel], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Skill created with id ${strSkillID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.put('/api/skills', (req, res) => {
    let strSkillID = getTrimmedString(req.body.strSkillID)
    let strSkillName = getTrimmedString(req.body.strSkillName)
    let strProficiencyLevel = getTrimmedString(req.body.strProficiencyLevel)

    let blnError = false
    let strMessage = ''

    if(strSkillID.length < 1){
        blnError = true
        strMessage += 'You must provide a skill id. '
    }
    if(strSkillName.length < 1){
        blnError = true
        strMessage += 'You must provide a skill name. '
    }

    if(blnError == false){
        const strQuery = "UPDATE tblSkills SET strSkillName = ?, strProficiencyLevel = ? WHERE strSkillID = ?"
        dbResume.run(strQuery, [strSkillName, strProficiencyLevel, strSkillID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Skill updated with id ${strSkillID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.delete('/api/skills/:skillid', (req, res) => {
    let strSkillID = req.params.skillid

    let blnError = false
    let strMessage = ''

    if(strSkillID.length < 1){
        blnError = true
        strMessage += 'You must provide a skill id.'
    }

    if(blnError == false){
        const strQuery = "DELETE FROM tblSkills WHERE strSkillID = ?"
        dbResume.run(strQuery, [strSkillID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Skill deleted with id ${strSkillID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

// ============================================================
// SECTION: Awards Routes
// ============================================================
app.get('/api/awards', (req, res) => {
    const strQuery = "SELECT * FROM tblAwards ORDER BY strAwardDate DESC, strAwardName ASC"
    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            res.status(200).json(rows)
        }
    })
})

app.post('/api/awards', (req, res) => {
    let strAwardName = getTrimmedString(req.body.strAwardName)
    let strAwardDate = getTrimmedString(req.body.strAwardDate)
    let strDescription = getTrimmedString(req.body.strDescription)

    let blnError = false
    let strMessage = ''

    if(strAwardName.length < 1){
        blnError = true
        strMessage += 'You must provide an award name. '
    }

    if(blnError == false){
        const strAwardID = uuidv4()
        const strQuery = "INSERT INTO tblAwards VALUES (?,?,?,?)"
        dbResume.run(strQuery, [strAwardID, strAwardName, strAwardDate, strDescription], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Award created with id ${strAwardID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.put('/api/awards', (req, res) => {
    let strAwardID = getTrimmedString(req.body.strAwardID)
    let strAwardName = getTrimmedString(req.body.strAwardName)
    let strAwardDate = getTrimmedString(req.body.strAwardDate)
    let strDescription = getTrimmedString(req.body.strDescription)

    let blnError = false
    let strMessage = ''

    if(strAwardID.length < 1){
        blnError = true
        strMessage += 'You must provide an award id. '
    }
    if(strAwardName.length < 1){
        blnError = true
        strMessage += 'You must provide an award name. '
    }

    if(blnError == false){
        const strQuery = "UPDATE tblAwards SET strAwardName = ?, strAwardDate = ?, strDescription = ? WHERE strAwardID = ?"
        dbResume.run(strQuery, [strAwardName, strAwardDate, strDescription, strAwardID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Award updated with id ${strAwardID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.delete('/api/awards/:awardid', (req, res) => {
    let strAwardID = req.params.awardid

    let blnError = false
    let strMessage = ''

    if(strAwardID.length < 1){
        blnError = true
        strMessage += 'You must provide an award id.'
    }

    if(blnError == false){
        const strQuery = "DELETE FROM tblAwards WHERE strAwardID = ?"
        dbResume.run(strQuery, [strAwardID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Award deleted with id ${strAwardID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

// ============================================================
// SECTION: Certifications Routes
// ============================================================
app.get('/api/certifications', (req, res) => {
    const strQuery = "SELECT * FROM tblCertifications ORDER BY strDateEarned DESC, strCertificationName ASC"
    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            res.status(200).json(rows)
        }
    })
})

app.post('/api/certifications', (req, res) => {
    let strCertificationName = getTrimmedString(req.body.strCertificationName)
    let strIssuingOrganization = getTrimmedString(req.body.strIssuingOrganization)
    let strDateEarned = getTrimmedString(req.body.strDateEarned)

    let blnError = false
    let strMessage = ''

    if(strCertificationName.length < 1){
        blnError = true
        strMessage += 'You must provide a certification name. '
    }
    if(strIssuingOrganization.length < 1){
        blnError = true
        strMessage += 'You must provide an issuing organization. '
    }

    if(blnError == false){
        const strCertificationID = uuidv4()
        const strQuery = "INSERT INTO tblCertifications VALUES (?,?,?,?)"
        dbResume.run(strQuery, [strCertificationID, strCertificationName, strIssuingOrganization, strDateEarned], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Certification created with id ${strCertificationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.put('/api/certifications', (req, res) => {
    let strCertificationID = getTrimmedString(req.body.strCertificationID)
    let strCertificationName = getTrimmedString(req.body.strCertificationName)
    let strIssuingOrganization = getTrimmedString(req.body.strIssuingOrganization)
    let strDateEarned = getTrimmedString(req.body.strDateEarned)

    let blnError = false
    let strMessage = ''

    if(strCertificationID.length < 1){
        blnError = true
        strMessage += 'You must provide a certification id. '
    }
    if(strCertificationName.length < 1){
        blnError = true
        strMessage += 'You must provide a certification name. '
    }
    if(strIssuingOrganization.length < 1){
        blnError = true
        strMessage += 'You must provide an issuing organization. '
    }

    if(blnError == false){
        const strQuery = "UPDATE tblCertifications SET strCertificationName = ?, strIssuingOrganization = ?, strDateEarned = ? WHERE strCertificationID = ?"
        dbResume.run(strQuery, [strCertificationName, strIssuingOrganization, strDateEarned, strCertificationID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Certification updated with id ${strCertificationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

app.delete('/api/certifications/:certificationid', (req, res) => {
    let strCertificationID = req.params.certificationid

    let blnError = false
    let strMessage = ''

    if(strCertificationID.length < 1){
        blnError = true
        strMessage += 'You must provide a certification id.'
    }

    if(blnError == false){
        const strQuery = "DELETE FROM tblCertifications WHERE strCertificationID = ?"
        dbResume.run(strQuery, [strCertificationID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Certification deleted with id ${strCertificationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

// ============================================================
// SECTION: Profile Routes
// ============================================================

// GET /api/profile
// Returns a JSON array containing the single profile record, or an empty
// array if no profile has been created yet.  The frontend uses the array
// length to decide whether to call POST (create) or PUT (update).
app.get('/api/profile', (req, res) => {
    const strQuery = "SELECT * FROM tblProfile"
    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            res.status(200).json(rows)
        }
    })
})

// POST /api/profile
// Creates the user's profile record.  strFullName is required;
// all other fields are optional.
app.post('/api/profile', (req, res) => {
    let strFullName = getTrimmedString(req.body.strFullName)
    let strPhone = getTrimmedString(req.body.strPhone)
    let strEmail = getTrimmedString(req.body.strEmail)
    let strLinkedIn = getTrimmedString(req.body.strLinkedIn)
    let strGitHub = getTrimmedString(req.body.strGitHub)
    let strCity = getTrimmedString(req.body.strCity)

    let blnError = false
    let strMessage = ''

    if(strFullName.length < 1){
        blnError = true
        strMessage += 'You must provide your full name. '
    }

    if(blnError == false){
        const strProfileID = uuidv4()
        // Insert into both strCity and strWebsite so existing queries
        // that read strWebsite continue to function during transition.
        const strQuery = "INSERT INTO tblProfile (strProfileID, strFullName, strPhone, strEmail, strLinkedIn, strGitHub, strCity, strWebsite) VALUES (?,?,?,?,?,?,?,?)"
        dbResume.run(strQuery, [strProfileID, strFullName, strPhone, strEmail, strLinkedIn, strGitHub, strCity, strCity], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Profile created with id ${strProfileID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// PUT /api/profile
// Updates the user's existing profile record.  Both strProfileID and
// strFullName are required.
app.put('/api/profile', (req, res) => {
    let strProfileID = getTrimmedString(req.body.strProfileID)
    let strFullName = getTrimmedString(req.body.strFullName)
    let strPhone = getTrimmedString(req.body.strPhone)
    let strEmail = getTrimmedString(req.body.strEmail)
    let strLinkedIn = getTrimmedString(req.body.strLinkedIn)
    let strGitHub = getTrimmedString(req.body.strGitHub)
    let strCity = getTrimmedString(req.body.strCity)

    let blnError = false
    let strMessage = ''

    if(strProfileID.length < 1){
        blnError = true
        strMessage += 'You must provide a profile id. '
    }
    if(strFullName.length < 1){
        blnError = true
        strMessage += 'You must provide your full name. '
    }

    if(blnError == false){
        const strQuery = "UPDATE tblProfile SET strFullName = ?, strPhone = ?, strEmail = ?, strLinkedIn = ?, strGitHub = ?, strCity = ?, strWebsite = ? WHERE strProfileID = ?"
        dbResume.run(strQuery, [strFullName, strPhone, strEmail, strLinkedIn, strGitHub, strCity, strCity, strProfileID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Profile updated with id ${strProfileID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// ============================================================
// SECTION: Education Routes
// ============================================================

// GET /api/education
// Returns a JSON array of all education records ordered by start date
// descending so the most recent credential appears first.
app.get('/api/education', (req, res) => {
    const strQuery = "SELECT * FROM tblEducation ORDER BY strStartDate DESC"
    dbResume.all(strQuery, [], function(err, rows){
        if(err){
            res.status(500).json({outcome: "error", message: err.message})
        } else {
            res.status(200).json(rows)
        }
    })
})

// POST /api/education
// Creates a new education record.  strInstitutionName and strDegree are
// required; all other fields are optional.
app.post('/api/education', (req, res) => {
    let strInstitutionName = getTrimmedString(req.body.strInstitutionName)
    let strDegree = getTrimmedString(req.body.strDegree)
    let strFieldOfStudy = getTrimmedString(req.body.strFieldOfStudy)
    let strStartDate = getTrimmedString(req.body.strStartDate)
    let strEndDate = getTrimmedString(req.body.strEndDate)
    let strLocation = getTrimmedString(req.body.strLocation)

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
        const strEducationID = uuidv4()
        const strQuery = "INSERT INTO tblEducation VALUES (?,?,?,?,?,?,?)"
        dbResume.run(strQuery, [strEducationID, strInstitutionName, strDegree, strFieldOfStudy, strStartDate, strEndDate, strLocation], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(201).json({outcome: "success", message: `Education created with id ${strEducationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// PUT /api/education
// Updates an existing education record.  strEducationID, strInstitutionName,
// and strDegree are all required.
app.put('/api/education', (req, res) => {
    let strEducationID = getTrimmedString(req.body.strEducationID)
    let strInstitutionName = getTrimmedString(req.body.strInstitutionName)
    let strDegree = getTrimmedString(req.body.strDegree)
    let strFieldOfStudy = getTrimmedString(req.body.strFieldOfStudy)
    let strStartDate = getTrimmedString(req.body.strStartDate)
    let strEndDate = getTrimmedString(req.body.strEndDate)
    let strLocation = getTrimmedString(req.body.strLocation)

    let blnError = false
    let strMessage = ''

    if(strEducationID.length < 1){
        blnError = true
        strMessage += 'You must provide an education id. '
    }
    if(strInstitutionName.length < 1){
        blnError = true
        strMessage += 'You must provide an institution name. '
    }
    if(strDegree.length < 1){
        blnError = true
        strMessage += 'You must provide a degree. '
    }

    if(blnError == false){
        const strQuery = "UPDATE tblEducation SET strInstitutionName = ?, strDegree = ?, strFieldOfStudy = ?, strStartDate = ?, strEndDate = ?, strLocation = ? WHERE strEducationID = ?"
        dbResume.run(strQuery, [strInstitutionName, strDegree, strFieldOfStudy, strStartDate, strEndDate, strLocation, strEducationID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Education updated with id ${strEducationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// DELETE /api/education/:educationid
// Permanently deletes the education record identified by the URL parameter.
app.delete('/api/education/:educationid', (req, res) => {
    let strEducationID = req.params.educationid

    let blnError = false
    let strMessage = ''

    if(strEducationID.length < 1){
        blnError = true
        strMessage += 'You must provide an education id.'
    }

    if(blnError == false){
        const strQuery = "DELETE FROM tblEducation WHERE strEducationID = ?"
        dbResume.run(strQuery, [strEducationID], function(err){
            if(err){
                res.status(500).json({outcome: "error", message: err.message})
            } else {
                res.status(200).json({outcome: "success", message: `Education deleted with id ${strEducationID}`})
            }
        })
    } else {
        res.status(400).json({errorMessage: strMessage})
    }
})

// ============================================================
// SECTION: Gemini Route
// ============================================================
app.post('/api/gemini', async (req, res) => {
    let strResumeContent = getTrimmedString(req.body.strResumeContent)

    let blnError = false
    let strMessage = ''

    if(strResumeContent.length < 1){
        blnError = true
        strMessage += 'You must provide resume content.'
    }
    if(!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length < 1){
        blnError = true
        strMessage += ' AI feedback is not available at this time.'
    }

    if(blnError == false){
        try {
            const objResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Review the following resume content. Return a JSON object with three array fields named strengths, weaknesses, and suggestions. Each array should contain concise strings only.\n\nResume Content:\n${strResumeContent}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        responseMimeType: 'application/json'
                    }
                })
            })

            if(objResponse.status === 429){
                res.status(429).json({
                    outcome: "error",
                    message: "Gemini rate limit reached. Please wait a moment and try again."
                })
                return
            }

            if(objResponse.ok == false){
                const objErrorData = await objResponse.json()
                res.status(objResponse.status).json({
                    outcome: "error",
                    message: objErrorData.error && objErrorData.error.message ? objErrorData.error.message : 'Gemini returned an unexpected response.'
                })
                return
            }

            const objData = await objResponse.json()
            const strGeminiText = objData.candidates && objData.candidates[0] && objData.candidates[0].content && objData.candidates[0].content.parts && objData.candidates[0].content.parts[0] ? objData.candidates[0].content.parts[0].text : '{}'
            const objFeedback = JSON.parse(strGeminiText)

            res.status(200).json({
                strengths: Array.isArray(objFeedback.strengths) ? objFeedback.strengths : [],
                weaknesses: Array.isArray(objFeedback.weaknesses) ? objFeedback.weaknesses : [],
                suggestions: Array.isArray(objFeedback.suggestions) ? objFeedback.suggestions : []
            })
        } catch(objError) {
            res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
    } else {
        res.status(400).json({errorMessage: strMessage.trim()})
    }
})

// ============================================================
// SECTION: Start Server Export
// ============================================================
let blnServerStarted = false
let objServerInstance = null

const startServer = async () => {
    if(blnServerStarted == true){
        return objServerInstance
    }

    await objDatabaseReadyPromise

    return await new Promise((resolve, reject) => {
        objServerInstance = app.listen(HTTP_PORT, () => {
            blnServerStarted = true
            console.log(`Server running on http://localhost:${HTTP_PORT}`)
            resolve(objServerInstance)
        })

        objServerInstance.on('error', (objError) => {
            reject(objError)
        })
    })
}

module.exports = {startServer}

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
