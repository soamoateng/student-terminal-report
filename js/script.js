let subjectCounter = 5;

document.addEventListener('DOMContentLoaded', function() {
    // Set current date automatically (Dec 5, 2025)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('issueDateHidden').value = today;
    
    // Add initial subjects WITH REMOVE BUTTONS (as requested)
    for(let i = 0; i < 5; i++) {
        addSubjectRow();
    }
    
    // Event listeners
    document.getElementById('addSubject').addEventListener('click', addSubjectRow);
    document.getElementById('terminalReportForm').addEventListener('submit', generateTerminalReport);
    
    // Image preview handlers
    document.getElementById('schoolLogo').addEventListener('change', previewImage);
    document.getElementById('studentPhoto').addEventListener('change', previewImage);
});

function previewImage(event) {
    const file = event.target.files[0];
    const container = document.getElementById(event.target.id + '-preview');
    
    if (file && container) {
        // Clear previous content
        container.innerHTML = '';
        
        // Create image element
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Preview';
        img.className = 'preview-img';
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove image';
        removeBtn.onclick = function() {
            // NEW: Remove uploaded image functionality
            event.target.value = '';  // Clear file input
            container.innerHTML = ''; // Clear preview
            URL.revokeObjectURL(img.src); // Free memory
        };
        
        container.appendChild(img);
        container.appendChild(removeBtn);
    }
}

function addSubjectRow() {
    const container = document.getElementById('subjectsContainer');
    const row = document.createElement('div');
    row.className = 'row subject-row';
    row.id = `subject-${subjectCounter}`;
    row.innerHTML = `
        <div class="col-md-5">
            <label class="form-label small">Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-control" placeholder="Subject Name" data-field="name" required>
        </div>
        <div class="col-md-3">
            <label class="form-label small">Max Marks</label>
            <input type="number" class="form-control" value="100" min="50" data-field="max">
        </div>
        <div class="col-md-2">
            <label class="form-label small">Pass Marks</label>
            <input type="number" class="form-control" value="35" min="20" data-field="min">
        </div>
        <div class="col-md-2">
            <label class="form-label small">Obtained Marks <span class="text-danger">*</span></label>
            <input type="number" class="form-control" placeholder="Marks" data-field="obtained" required min="0">
        </div>
        <div class="col-md-12 mt-2">
            <!-- SUBJECT REMOVE BUTTON PRESERVED as requested -->
            <button type="button" class="btn btn-sm btn-danger" onclick="removeSubjectRow(${subjectCounter})">
                <i class="fas fa-trash"></i> Remove Subject
            </button>
        </div>
    `;
    container.appendChild(row);
    subjectCounter++;
}

function removeSubjectRow(id) {
    const row = document.getElementById(`subject-${id}`);
    if(row) row.remove();
}

function generateTerminalReport(e) {
    e.preventDefault();
    
    const formData = {
        schoolName: document.getElementById('schoolName').value,      // CHANGED: academyName → schoolName
        academicYear: document.getElementById('academicYear').value,
        academicTerm: document.getElementById('academicTerm').value,
        studentName: document.getElementById('studentName').value,
        studentClass: document.getElementById('studentClass').value,
        issueDate: document.getElementById('issueDateHidden').value,
        schoolLogo: document.getElementById('schoolLogo').files[0],   // CHANGED: schoolLogo
        studentPhoto: document.getElementById('studentPhoto').files[0],
        subjects: []
    };
    
    // Collect valid subjects only
    let validSubjects = 0;
    document.querySelectorAll('.subject-row').forEach(row => {
        const inputs = row.querySelectorAll('input[data-field]');
        const subject = {};
        inputs.forEach(input => {
            subject[input.dataset.field] = input.value;
        });
        if(subject.name && subject.obtained && parseFloat(subject.obtained) >= 0) {
            formData.subjects.push(subject);
            validSubjects++;
        }
    });
    
    if(validSubjects === 0) {
        alert('Please add at least one subject with name and obtained marks.');
        return;
    }
    
    const totalMax = formData.subjects.reduce((sum, s) => sum + parseInt(s.max || 0), 0);
    const totalObtained = formData.subjects.reduce((sum, s) => sum + parseInt(s.obtained || 0), 0);
    const percentage = totalMax ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
    const overallGrade = getGrade(percentage);
    
    const terminalReportHTML = generateTerminalReportHTML(formData, totalMax, totalObtained, percentage, overallGrade);
    
    document.getElementById('terminalReportContainer').innerHTML = terminalReportHTML;
    document.getElementById('terminalReportPreview').style.display = 'block';
    document.getElementById('terminalReportContainer').scrollIntoView({ behavior: 'smooth' });
}

function generateTerminalReportHTML(data, totalMax, totalObtained, percentage, overallGrade) {
    const subjectsRows = data.subjects.map(s => {
        const grade = getGrade((s.obtained / s.max) * 100);
        const gradeClass = getGradeClass(grade);
        return `
            <tr>
                <td>${s.name}</td>
                <td>${s.max || 100}</td>
                <td>${s.min || 35}</td>
                <td>${s.obtained || 0}</td>
                <td class="${gradeClass}">${grade}</td>
            </tr>
        `;
    }).join('');
    
    const logoHTML = data.schoolLogo ? 
        `<img src="${URL.createObjectURL(data.schoolLogo)}" alt="School Logo">` : 
        `<i class="fas fa-graduation-cap fa-3x" style="color:#3a8eba;"></i>`;
    
    const photoHTML = data.studentPhoto ? 
        `<img src="${URL.createObjectURL(data.studentPhoto)}" alt="Student Photo">` : 
        `<i class="fas fa-user fa-3x text-secondary"></i>`;
    
    const totalPassMarks = data.subjects.reduce((sum, s) => sum + parseInt(s.min || 35), 0);
    
    return `
        <div class="terminalreport position-relative">
            <div class="terminalreport-header">
                <div class="terminalreport-logo">${logoHTML}</div>
                <div class="terminalreport-title">${data.schoolName}</div>  <!-- CHANGED: schoolName -->
                <div>Academic Year ${data.academicYear}</div>
                <div>${data.academicTerm} Term</div>
                <div class="mt-2">STUDENT TERMINAL REPORT</div>
                <div class="student-photo">${photoHTML}</div>
            </div>
            
            <div class="student-info">
                <div class="info-row">
                    <div class="info-item">
                        <div class="info-label">Student Name:</div>
                        <div>${data.studentName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Class:</div>
                        <div>${data.studentClass}</div>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-bordered terminalreport-table mb-0">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Max Marks</th>
                            <th>Pass Marks</th>
                            <th>Obtained</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>${subjectsRows}</tbody>
                    <tfoot>
                        <tr class="table-secondary">
                            <td colspan="1" class="text-end fw-bold">Total</td>
                            <td class="fw-bold">${totalMax}</td>
                            <td class="fw-bold">${totalPassMarks}</td>
                            <td class="fw-bold">${totalObtained}</td>
                            <td></td>
                        </tr>
                        <tr class="table-secondary">
                            <td colspan="1" class="text-end fw-bold">Percentage</td>
                            <td colspan="3" class="fw-bold">${percentage}%</td>
                            <td class="${getGradeClass(overallGrade)}">${overallGrade}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="result-section">
                <div class="d-flex justify-content-between">
                    <div>
                        <div class="mb-2"><strong>Grading Scale:</strong></div>
                        <div class="small">
                            <div><span class="grade-a">A+ (90-100)</span> - Outstanding</div>
                            <div><span class="grade-a">A (80-89)</span> - Excellent</div>
                            <div><span class="grade-b">B+ (70-79)</span> - Very Good</div>
                            <div><span class="grade-c">C (50-69)</span> - Average</div>
                            <div><span class="grade-f">F (Below 50)</span> - Fail</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="mb-3">
                            <div class="result-box">
                                ${totalObtained >= (totalMax * 0.4) ? 'PASS' : 'FAIL'} 
                                <i class="fas fa-${totalObtained >= (totalMax * 0.4) ? 'check-circle' : 'times-circle'} ms-1"></i>
                            </div>
                        </div>
                        <div>
                            <div class="fw-bold">Issue Date: ${new Date(data.issueDate).toLocaleDateString('en-GB')}</div>
                            <div>Certificate No: AUTO-GENERATED</div>
                        </div>
                    </div>
                </div>
                
                <div class="signature-section">
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div>Class Teacher</div>
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div>Principal</div>
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div>Examination Controller</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getGrade(score) {
    if(score >= 90) return 'A+';
    if(score >= 80) return 'A';
    if(score >= 70) return 'B+';
    if(score >= 60) return 'B';
    if(score >= 50) return 'C';
    if(score >= 40) return 'D';
    return 'F';
}

function getGradeClass(grade) {
    if(grade.includes('A')) return 'grade-a';
    if(grade.includes('B')) return 'grade-b';
    if(grade.includes('C') || grade.includes('D')) return 'grade-c';
    return 'grade-f';
}

function printTerminalReport() {
    window.print();
}

function resetForm() {
    document.getElementById('terminalReportForm').reset();
    document.getElementById('terminalReportPreview').style.display = 'none';
    document.getElementById('subjectsContainer').innerHTML = '';
    document.querySelectorAll('.image-preview-container').forEach(container => {
        container.innerHTML = '';
    });
    subjectCounter = 5;
    location.reload();
}
