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
const fs = require('fs')
const path = require('path')

const copyFile = (strSourcePath, strDestinationPath) => {
    const strDestinationDirectory = path.dirname(strDestinationPath)

    if(fs.existsSync(strDestinationDirectory) == false){
        fs.mkdirSync(strDestinationDirectory, {recursive: true})
    }

    fs.copyFileSync(strSourcePath, strDestinationPath)
}

const strRootDirectory = path.resolve(__dirname, '..')

copyFile(
    path.join(strRootDirectory, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css'),
    path.join(strRootDirectory, 'css', 'lib', 'bootstrap.min.css')
)

copyFile(
    path.join(strRootDirectory, 'node_modules', 'bootstrap', 'dist', 'js', 'bootstrap.bundle.min.js'),
    path.join(strRootDirectory, 'js', 'lib', 'bootstrap.bundle.min.js')
)

copyFile(
    path.join(strRootDirectory, 'node_modules', 'sweetalert2', 'dist', 'sweetalert2.all.min.js'),
    path.join(strRootDirectory, 'js', 'lib', 'sweetalert2@11.min.js')
)

// Copy FontAwesome CSS to css/lib so it can be loaded locally (no CDN)
copyFile(
    path.join(strRootDirectory, 'node_modules', '@fortawesome', 'fontawesome-free', 'css', 'all.min.css'),
    path.join(strRootDirectory, 'css', 'lib', 'all.min.css')
)


// FontAwesome requires its webfont files to be co-located relative to the CSS.
// Read every file in the fontawesome webfonts directory and copy each one to
// the local /webfonts/ directory so icons render correctly at runtime.
// NOTE: all.min.css uses @font-face with relative paths of the form
//   url(../webfonts/fa-solid-900.woff2)
// When the CSS lives at css/lib/all.min.css, Electron resolves those URLs to
// css/webfonts/ (one directory up from lib/).  We therefore copy the webfonts
// to BOTH /webfonts/ (per the project file structure) AND css/webfonts/ (where
// the CSS @font-face rules actually resolve at runtime) so that icon glyphs
// render correctly in the Electron window.
const arrWebfontFiles = fs.readdirSync(
    path.join(strRootDirectory, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts')
)
arrWebfontFiles.forEach(strFile => {
    // Copy to project-root /webfonts/ (matches file structure in AGENT.md)
    copyFile(
        path.join(strRootDirectory, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts', strFile),
        path.join(strRootDirectory, 'webfonts', strFile)
    )
    // Copy to css/webfonts/ so the ../webfonts/ relative paths in all.min.css
    // resolve correctly when Electron loads the renderer
    copyFile(
        path.join(strRootDirectory, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts', strFile),
        path.join(strRootDirectory, 'css', 'webfonts', strFile)
    )
})

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
