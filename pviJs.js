function Student(group, firstname, lastname, gender, birth, status, id) {
    this.group = group;
    this.firstName = firstname;
    this.lastName = lastname;
    this.gender = gender;
    this.birth = birth;
    this.status = status;
    this.id = id;
}


let studentsCount = 0;
let students = [];
let curPage = 1;
let maxStudentsOnPage = 5;
let maxId = 0;
const maxButtons = 5;
let userLogined = false;

function openModal(mode, row) {
    if (userLogined) {
        let modal = document.getElementById("myModal");
        modal.style.display = "block"; // Make it visible

        setTimeout(() => {
            modal.classList.add("show"); // Trigger slide-down animation
        }, 10); // Delay ensures transition works properly


        document.getElementById("groupDropdown").value = "";
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        document.getElementById("genderDropdown").value = "";
        document.getElementById("birthday").value = "";

        let okButton = document.getElementById("okButton");
        let addButton = document.getElementById("addStudent");

        /*okButton.removeEventListener("click", editStudent);
        okButton.removeEventListener("click", OkButtonClick);
        addButton.removeEventListener("click", editStudent);
        addButton.removeEventListener("click", AddStudent);*/

        let newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);

        let newAddButton = addButton.cloneNode(true);
        addButton.parentNode.replaceChild(newAddButton, addButton);

        if (mode == 1) {
            newOkButton.addEventListener("click", function () {
                editStudent(row);
            });
            newAddButton.addEventListener("click", function () {
                editStudent(row);
            });

            let group = document.getElementById("groupDropdown");
            let firstName = document.getElementById("firstName");
            let lastName = document.getElementById("lastName");
            let gender = document.getElementById("genderDropdown");
            let birth = document.getElementById("birthday");
            group.value = row.cells[1].textContent;
            firstName.value = row.cells[2].dataset.firstName;
            lastName.value = row.cells[2].dataset.lastName;
            gender.value = row.cells[3].textContent;
            birth.value = row.cells[4].textContent;
            document.getElementById("headerModal").innerHTML = "Change info";
            document.getElementById("addStudent").innerHTML = "Change";
        }
        else {
            console.log("here1");
            newOkButton.addEventListener("click", OkButtonClick);
            newAddButton.addEventListener("click", AddStudent);
            document.getElementById("headerModal").innerHTML = "Add New Student";
            document.getElementById("addStudent").innerHTML = "Create";
        }
    }
}



function closeModal() {
    let modal = document.getElementById("myModal");

    modal.classList.remove("show"); // Remove "show" class
    modal.classList.add("closing"); // Start slide-up animation

    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.classList.remove("closing"); // Reset animation state
        modal.style.display = "none"; // Hide modal after animation completes
    }, 500); // Must match CSS transition time (0.5s)

    let firstNameInput = document.getElementById("firstName");
    let lastNameInput = document.getElementById("lastName");
    let birthInput = document.getElementById("birthday");
    let groupDropdown = document.getElementById("groupDropdown");
    let genderDropdown = document.getElementById("genderDropdown");
    clearError(firstNameInput);
    clearError(lastNameInput);
    clearError(birthInput);
    clearError(groupDropdown);
    clearError(genderDropdown);

}

function showError(input, message) {
    console.log(input);
    let errorSpan = input.nextElementSibling; // Get next element (error message)
    errorSpan.textContent = message;
    input.classList.add("input-error");
}

function clearError(input) {
    console.log(input);
    let errorSpan = input.nextElementSibling;
    errorSpan.innerHTML = "&nbsp;";
    input.classList.remove("input-error");
}

function validateName(nameInput) {

    let namePattern = /^[a-zA-Zа-яА-ЯіІїЇєЄ'-]{2,50}(?:\s[a-zA-Zа-яА-ЯіІїЇєЄ'-]{1,50})*$/;
    if (!namePattern.test(nameInput.value.trim())) {
        showError(nameInput, "Enter a valid name (only letters, spaces, hyphens).");
        return false;
    }
    clearError(nameInput);
    return true;
}

function validateDropdown(input) {

    if (!input.value) {
        showError(input, "Please fill this dropdown.");
        return false;
    }
    clearError(input);
    return true;
}

function validateBirthdate(birthInput) {
    let birthDate = new Date(birthInput.value);
    let today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    if (isNaN(birthDate) || age < 5) {
        showError(birthInput, "Minimum age is 5 years.");
        return false;
    }
    clearError(birthInput);
    return true;
}

function validateSelect(input) {
    let word = /\bselect\b/i;
    let res = word.test(input.value.trim());
    console.log(res);
    return res;
}

function AddStudent() {

    let table = document.getElementById("table");
    let group = document.getElementById("groupDropdown").value.trim();
    let firstName = document.getElementById("firstName").value.trim();
    let lastName = document.getElementById("lastName").value.trim();
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value.trim();

    let firstNameInput = document.getElementById("firstName");
    let lastNameInput = document.getElementById("lastName");
    let birthInput = document.getElementById("birthday");
    let groupDropdown = document.getElementById("groupDropdown");
    let genderDropdown = document.getElementById("genderDropdown");


    let isValid = validateName(firstNameInput) & validateName(lastNameInput) & validateBirthdate(birthInput)
        & validateDropdown(groupDropdown) & validateDropdown(genderDropdown);
    if (!isValid) return;

    if (validateSelect(firstNameInput)) {
        let warning = document.getElementById("warning");
        console.log(warning);
        warning.style.display = "block";
        closeModal();
        return;
    }


    let status = (firstName + " " + lastName === document.getElementById("username").innerHTML) ? "online" : "offline";
    let id = maxId + 1;
    maxId++;

    
    
    closeModal();
    
    let studentData = {
        id: id,
        group: group,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        birth: birth
    };
    
        fetch("http://localhost:80/save_student.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Student saved:", data.student);
                students.push(new Student(group, firstName, lastName, gender, birth, status, id));
                updateTable();
                updatePaginationButtons(students);
            } else {
                alert("Failed to save student: " + data.message);
            }
        })
        .catch(err => {
            console.error("Error saving student:", err);
        });

    }
    
    function OkButtonClick() {
        let table = document.getElementById("table");
        let group = document.getElementById("groupDropdown").value.trim();
        let firstName = document.getElementById("firstName").value.trim();
        let lastName = document.getElementById("lastName").value.trim();
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value.trim();

    let firstNameInput = document.getElementById("firstName");
    let lastNameInput = document.getElementById("lastName");
    let birthInput = document.getElementById("birthday");
    let groupDropdown = document.getElementById("groupDropdown");
    let genderDropdown = document.getElementById("genderDropdown");


    let isValid = validateName(firstNameInput) & validateName(lastNameInput) & validateBirthdate(birthInput)
        & validateDropdown(groupDropdown) & validateDropdown(genderDropdown);
    if (!isValid) {
        closeModal();
        return;
    }


    let status = (firstName + " " + lastName === document.getElementById("username").innerHTML) ? "online" : "offline";
    let id = maxId + 1;
    maxId++;

    students.push(new Student(group, firstName, lastName, gender, birth, status, id));



    updateTable();
    updatePaginationButtons(students);
    closeModal();

    let studentData = {
        id: id,
        group: group,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        birth: birth
    };

    //fetch("save_student.php", {
    fetch("http://localhost:80/save_student.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Student saved:", data.student);
            } else {
                alert("Failed to save student: " + data.message);
            }
        })
        .catch(err => {
            console.error("Error saving student:", err);
        });
}

function updateTable() {
    let table = document.getElementById("table");

    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    console.log(curPage, curPage - 1, maxStudentsOnPage);

    for (let i = (curPage - 1) * maxStudentsOnPage; i < (curPage - 1) * maxStudentsOnPage + maxStudentsOnPage; i++) {

        console.log(i, curPage, curPage - 1, maxStudentsOnPage);
        if (i == students.length)
            break;
        let newRow = table.insertRow();

        newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;
        console.log(i);
        console.log(students[i]);
        newRow.insertCell(1).textContent = students[i].group;

        let nameCell = newRow.insertCell(2);
        nameCell.innerHTML = students[i].firstName + " " + students[i].lastName;
        nameCell.dataset.firstName = students[i].firstName;
        nameCell.dataset.lastName = students[i].lastName;

        newRow.insertCell(3).textContent = students[i].gender;
        newRow.insertCell(4).textContent = students[i].birth;
        newRow.insertCell(5).textContent = students[i].status;
            
        let optionsCell = newRow.insertCell(6);

        let editBtn = createButton("edit", "editBtn", () => openModal(1, newRow));
        let deleteBtn = createButton("delete", "deleteBtn", () => openDltModal(newRow, 1));
        optionsCell.appendChild(editBtn);
        optionsCell.appendChild(deleteBtn);

        let idCell = newRow.insertCell(7);
        idCell.textContent = students[i].id;
        idCell.style.display = "none";
    }
}

function createButton(icon, className, onClickHandler) {
    let button = document.createElement("button");
    button.className = `editButton ${className}`;
    button.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
    button.addEventListener("click", onClickHandler);
    return button;
}



function editStudent(row) {
    console.log(row);
    let group = document.getElementById("groupDropdown").value.trim();
    let firstname = document.getElementById("firstName").value.trim();
    let lastname = document.getElementById("lastName").value.trim();
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value.trim();


    let firstNameInput = document.getElementById("firstName");
    let lastNameInput = document.getElementById("lastName");
    let birthInput = document.getElementById("birthday");
    let groupDropdown = document.getElementById("groupDropdown");
    let genderDropdown = document.getElementById("genderDropdown");
    let isValid = validateName(firstNameInput) & validateName(lastNameInput) & validateBirthdate(birthInput)
        & validateDropdown(groupDropdown) & validateDropdown(genderDropdown);

    if (!isValid) {
        return;
    }
    let name = firstname + " " + lastname;
    row.cells[1].textContent = group;
    row.cells[2].textContent = name;
    row.cells[3].textContent = gender;
    row.cells[4].textContent = birth;
    let id = row.cells[7].textContent;

    for (let i = 0; i < students.length; i++) {
        if (students[i].id == id) {
            students[i].group = group;
            students[i].firstName = firstname;
            students[i].lastName = lastname;
            students[i].gender = gender;
            students[i].birth = birth;
        }
    }
    let studentData = {
        id: id,
        group: group,
        firstName: firstname,
        lastName: lastname,
        gender: gender,
        birth: birth
    };

    let jsonString = JSON.stringify(studentData);
    console.log("Student Data:", jsonString);

    fetch("http://localhost:80/edit_student.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("Student updated:", data.student);
            } else {
                console.error("Update failed:", data.message);
            }
        });

    closeModal();

}

function deleteSelected() {
    let table = document.getElementById("table");
    let checkboxes = document.querySelectorAll(".row-checkbox");

    // Loop through checkboxes in reverse order to avoid index shifting issues
    let ids = [];
    for (let i = checkboxes.length - 1; i >= 0; i--) {
        if (checkboxes[i].checked) {
            let row = checkboxes[i].closest("tr");
            let id = row.cells[7].textContent;
            ids.push(id);
            table.deleteRow(checkboxes[i].closest("tr").rowIndex);
        }
    }
    deleteStudentsByIds(ids);
    closeDltModal();
}

function openDltModal(newRow, countToDelete) {
    if(userLogined)
    {
    let dltModal = document.getElementById("deleteModal");
    dltModal.style.display = "block";

    setTimeout(() => {
        dltModal.classList.add("show"); // Trigger slide-down animation
    }, 10); // Delay ensures transition works properly

    let dltText = document.getElementById("dltText");
    let dltButton = document.getElementById("deleteModalButton");
    let table = document.getElementById("table");

    let newDltButton = dltButton.cloneNode(true);
    dltButton.replaceWith(newDltButton);
    dltButton = newDltButton; // Update reference

    let ids = [];
    if (countToDelete == 1) {
        dltText.innerHTML = "Do you want to delete " + newRow.cells[2].textContent + "?";
        dltButton.addEventListener("click", function () {
            table.deleteRow(newRow.rowIndex);
            ids.push(newRow.cells[7].textContent);
            deleteStudentsByIds(ids);
            closeDltModal();
        });
    }
    else {
        dltText.innerText = "Do you want to delete selected students?";
        dltButton.addEventListener("click", function () {
            deleteSelected();
        });
    }

    updatePaginationButtons(students);
}

}

function deleteStudentsByIds(ids) {

    students = students.filter(student => !ids.includes(student.id.toString()));

    fetch("http://localhost:80/delete_students.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(ids) // just an array like ["id1", "id2"]
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("Deleted students:", ids);
                updatePaginationButtons(students);
                console.log(curPage + ' before');
                if (Math.ceil(students.length / maxStudentsOnPage) < curPage)
                    curPage = students.length / maxStudentsOnPage;

                if (curPage < 1)
                    curPage = 1;

                console.log(curPage +'after');

                updateTable();
            } else {
                console.error("Delete failed:", data.message);
            }
        })
        .catch(err => console.error("Request error:", err));
}

function closeDltModal() {
    let dltModal = document.getElementById("deleteModal");

    dltModal.classList.remove("show"); // Remove "show" class
    dltModal.classList.add("closing"); // Start slide-up animation


    // Wait for animation to complete before hiding
    setTimeout(() => {
        dltModal.classList.remove("closing"); // Reset animation state
        dltModal.style.display = "none"; // Hide modal after animation completes
    }, 500); // Must match CSS transition time (0.5s)
}

function addStudentToTable(student) {
    let table = document.getElementById("table");
    let newRow = table.insertRow();

    newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;
    newRow.insertCell(1).textContent = student.group;

    let nameCell = newRow.insertCell(2);
    nameCell.innerHTML = student.firstName + " " + student.lastName;
    nameCell.dataset.firstName = student.firstName;
    nameCell.dataset.lastName = student.lastName;

    newRow.insertCell(3).textContent = student.gender;
    newRow.insertCell(4).textContent = student.birth;
    newRow.insertCell(5).textContent = "offline";

    let optionsCell = newRow.insertCell(6);
    let editBtn = createButton("edit", "editBtn", () => openModal(1, newRow));
    let deleteBtn = createButton("delete", "deleteBtn", () => openDltModal(newRow, 1));
    optionsCell.appendChild(editBtn);
    optionsCell.appendChild(deleteBtn);

    let idCell = newRow.insertCell(7);
    idCell.textContent = student.id;
    idCell.style.display = "none";

    let status = (firstName + " " + lastName === document.getElementById("username").innerHTML) ? "online" : "offline";
    students.push(new Student(student.group, student.firstName, student.lastName, student.gender, student.birth, status, student.id));

    if (maxId < student.id)
        maxId = student.id;

    updatePaginationButtons(students);
    updateTable();
}

function updatePaginationButtons(students) {
    const container = document.querySelector(".pagination-buttons");
    container.innerHTML = '';

    const totalPages = Math.ceil(students.length / 5);
    if (totalPages === 0) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pag-button";
    prevBtn.innerHTML = "&#60;";
    prevBtn.disabled = curPage === 1;
    prevBtn.addEventListener("click", () => {
        if (curPage > 1) {
            curPage--;
            updatePaginationButtons(students);
            updateTable();
        }
    });
    container.appendChild(prevBtn);

    let startPage = Math.max(1, curPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons && totalPages >= maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = "pag-button";
        pageBtn.textContent = i;
        if (i === curPage) pageBtn.classList.add("active");
        pageBtn.addEventListener("click", () => {
            curPage = i;
            updatePaginationButtons(students);
            updateTable();
        });
        container.appendChild(pageBtn);
    }

    // Create Next button
    const nextBtn = document.createElement("button");
    nextBtn.className = "pag-button";
    nextBtn.innerHTML = "&#62;";
    nextBtn.disabled = curPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if (curPage < totalPages) {
            curPage++;
            updatePaginationButtons(students);
            updateTable();
        }
    });
    container.appendChild(nextBtn);
}

function OpenLogInModal() {
    let loginModal = document.getElementById("loginModal");
    loginModal.style.display = "block";

    setTimeout(() => {
        loginModal.classList.add("show"); // Trigger slide-down animation
    }, 10); // Delay ensures transition works properly
}

function closeLogInModal() {
    let loginModal = document.getElementById("loginModal");

    loginModal.classList.remove("show"); // Remove "show" class
    loginModal.classList.add("closing"); // Start slide-up animation


    // Wait for animation to complete before hiding
    setTimeout(() => {
        loginModal.classList.remove("closing"); // Reset animation state
        loginModal.style.display = "none"; // Hide modal after animation completes
    }, 500); // Must match CSS transition time (0.5s)
}

function TryLogin() {
    let login = document.getElementById("loginInput").value;
    let password = document.getElementById("passwordInput").value;

    let loginInput = document.getElementById("loginInput");
    let passwordInput = document.getElementById("passwordInput");

    fetch("http://localhost/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                userLogined = true;
                localStorage.setItem("userLogined", "true");
                localStorage.setItem("username", data.username);
                sessionStorage.setItem("username", data.username);
                sessionStorage.setItem("userId", data.userId);
                console.log(sessionStorage.getItem("username"));
                console.log(sessionStorage.getItem("userId"));

                let username = document.getElementById("username");
                username.innerText = data.username;

                let loginbutton = document.getElementById("loginbutton");
                loginbutton.innerText = "Log out";
                loginbutton.onclick = LogOut;

                for (let i = 0; i < students.length; i++) {
                    if (students[i].firstName + " " + students[i].lastName == data.username) {
                        students[i].status = "online";
                    }
                }

                updateTable();
                closeLogInModal();

                // Show notification container and initialize notifications
                const notificationContainer = document.querySelector('.notification-container');
                if (notificationContainer) {
                    notificationContainer.style.display = 'inline-block';
                    initializeNotificationsAfterLogin(data.userId);
                }
            } else {
                if (data.message === "Wrong password") {
                    showError(passwordInput, "Wrong password");
                } else if (data.message === "Wrong login") {
                    showError(loginInput, "Wrong login!");
                }
            }
        });
}
    

function LogOut() {
    userLogined = false;

    localStorage.removeItem("userLogined");
    localStorage.removeItem("username");

    let username = document.getElementById("username");
    for (let i = 0; i < students.length; i++) {
        if (students[i].firstName + " " + students[i].lastName == username.innerText) {
            students[i].status = "offline";
        }
    }

    let loginbutton = document.getElementById("loginbutton");
    loginbutton.innerText = "Log in";
    username.innerText = "Logged out";

    updateTable();
    loginbutton.onclick = OpenLogInModal;

    // Hide notification container and clear notifications
    const notificationContainer = document.querySelector('.notification-container');
    if (notificationContainer) {
        notificationContainer.style.display = 'none';
        const notificationDropdown = document.getElementById('notificationDropdown');
        if (notificationDropdown) {
            notificationDropdown.innerHTML = '';
        }
        const notificationIndicator = document.getElementById('notificationIndicator');
        if (notificationIndicator) {
            notificationIndicator.style.display = 'none';
        }
    }
}

async function loadStudents() {
    try {
        const response = await fetch("http://localhost:80/students_load.php");
        const data = await response.json();
        
        data.forEach(student => {
            addStudentToTable(student);
        });
    } catch (error) {
        console.error("Error loading students:", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    // Check session storage for login status
    const storedUsername = sessionStorage.getItem("username");
    const storedUserId = sessionStorage.getItem("userId");
    
    if (storedUsername && storedUserId) {
        userLogined = true;
        document.getElementById('username').innerText = storedUsername;
        document.getElementById('loginbutton').innerText = "Log out";
        document.getElementById('loginbutton').onclick = LogOut;

        // Show notification container
        const notificationContainer = document.querySelector('.notification-container');
        if (notificationContainer) {
            notificationContainer.style.display = 'inline-block';
            if (typeof initializeNotifications === 'function') {
                initializeNotifications(storedUserId);
            }
        }
    }

    loadStudents();
    
    let userdropdown = document.getElementById("userdropdown");
    let username = document.getElementById("username");
    
    username.addEventListener("mouseover", function () {
        userdropdown.classList.add("show");
    });
    
    username.addEventListener("mouseleave", function () {
        userdropdown.classList.remove("show");
    });
    
    userdropdown.addEventListener("mouseover", function () {
        userdropdown.classList.add("show");
    });
    
    userdropdown.addEventListener("mouseleave", function () {
        userdropdown.classList.remove("show");
    });
    
    var masterCheckbox = document.getElementById("masterCheckbox");
    
    masterCheckbox.addEventListener('change', function () {
        var checkboxes = document.querySelectorAll(".row-checkbox");
        
        checkboxes.forEach(element => {
            element.checked = masterCheckbox.checked;
        });
    });
});
    
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
        .register("/pvi/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("Service Worker registration failed", err));
    }