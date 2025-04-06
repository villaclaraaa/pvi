function Student(group, firstname, lastname, gender, birth, status, id){
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

function openModal(mode, row){
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

    okButton.removeEventListener("click", editStudent);
    okButton.removeEventListener("click", OkButtonClick);
    addButton.removeEventListener("click", editStudent);
    addButton.removeEventListener("click", AddStudent);

    if(mode == 1)
    {
        okButton.addEventListener("click", function(){
            editStudent(row);
        });
        addButton.addEventListener("click", function(){
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
    else
    {
        console.log("here1");
        okButton.addEventListener("click", OkButtonClick);
        addButton.addEventListener("click", AddStudent);
        document.getElementById("headerModal").innerHTML = "Add New Student";
        document.getElementById("addStudent").innerHTML = "Create";
    }
}



function closeModal(){
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
    clearError(firstNameInput);
    clearError(lastNameInput);
    clearError(birthInput);

}

function showError(input, message) {
    let errorSpan = input.nextElementSibling; // Get next element (error message)
    errorSpan.textContent = message;
    input.classList.add("input-error");
}

function clearError(input) {
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

function validateDropdown(input){
    if(!input.value)
    {
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

    
    let status = (firstName + " " + lastName === document.getElementById("username").innerHTML) ? "online" : "offline";
    let id = students.length + 1;

    students.push(new Student(group, firstName, lastName, gender, birth, status, id));

    let newRow = table.insertRow();

    newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;
    newRow.insertCell(1).textContent = group;
    
    let nameCell = newRow.insertCell(2);
    nameCell.innerHTML = firstName + " " + lastName;
    nameCell.dataset.firstName = firstName;
    nameCell.dataset.lastName = lastName;  
    
    newRow.insertCell(3).textContent = gender;
    newRow.insertCell(4).textContent = birth;
    newRow.insertCell(5).textContent = status;

    let optionsCell = newRow.insertCell(6);
    let editBtn = createButton("edit", "editBtn", () => openModal(1, newRow));
    let deleteBtn = createButton("delete", "deleteBtn", () => openDltModal(newRow, 1));

    optionsCell.appendChild(editBtn);
    optionsCell.appendChild(deleteBtn);

    closeModal();
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
    let isValid = validateName(firstNameInput) & validateName(lastNameInput) & validateBirthdate(birthInput);
    if (!isValid)
    {
        closeModal();
        
        return;
    }

    let status = (name === document.getElementById("username").innerHTML) ? "online" : "offline";

    students.push(new Student(group, name, gender, birth, status));

    let newRow = table.insertRow();
    newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;
    newRow.insertCell(1).textContent = group;
    nameCell.textContent = firstName + " " + lastName;
    nameCell.dataset.firstName = firstName;
    nameCell.dataset.lastName = lastName;
    newRow.insertCell(3).textContent = gender;
    newRow.insertCell(4).textContent = birth;
    newRow.insertCell(5).textContent = status;

    let optionsCell = newRow.insertCell(6);
    let editBtn = createButton("edit", "editBtn", () => openModal(1, newRow));
    let deleteBtn = createButton("delete", "deleteBtn", () => openDltModal(newRow, 1));

    optionsCell.appendChild(editBtn);
    optionsCell.appendChild(deleteBtn);

    closeModal();
}

function createButton(icon, className, onClickHandler) {
    let button = document.createElement("button");
    button.className = `editButton ${className}`;
    button.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
    button.addEventListener("click", onClickHandler);
    return button;
}



function editStudent(row)
{
    let group = document.getElementById("groupDropdown").value.trim();
    let firstname = document.getElementById("firstName").value.trim();
    let lastname = document.getElementById("lastName").value.trim();
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value.trim();

    if (!group) {
        alert("Please select a group!");
        return;
    }

    if (!validateName(firstname)) {
        alert("Enter a valid firstname (only letters, spaces, and hyphens)!");
        return;
    }

    if (!validateName(lastname)) {
        alert("Enter a valid lastname (only letters, spaces, and hyphens)!");
        return;
    }

    if (!validateBirthdate(birth)) {
        alert("Enter a valid birthdate (minimum age: 5 years)!");
        return;
    }

    if (!gender) {
        alert("Please select a gender!");
        return;
    }

    let name = firstname + " " + lastname;
    row.cells[1].textContent = group;
    row.cells[2].textContent = name;
    row.cells[3].textContent = gender;
    row.cells[4].textContent = birth;

    let studentData = {
        group: group,
        name: name,
        gender: gender,
        birth: birth
    };

    let jsonString = JSON.stringify(studentData);
    console.log("Student Data:", jsonString);

    // Close Modal
    closeModal();

}

function deleteSelected(){
    let table = document.getElementById("table"); 
    let checkboxes = document.querySelectorAll(".row-checkbox"); 

    // Loop through checkboxes in reverse order to avoid index shifting issues
    for (let i = checkboxes.length - 1; i >= 0; i--) {
        if (checkboxes[i].checked) {
            table.deleteRow(checkboxes[i].closest("tr").rowIndex);
        }
    }
    closeDltModal();
}

function openDltModal(newRow, countToDelete){
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

    if(countToDelete == 1)
    {
        dltText.innerHTML = "Do you want to delete " + newRow.cells[2].textContent + "?";
        dltButton.addEventListener("click", function() {
            table.deleteRow(newRow.rowIndex);
            closeDltModal();
        });
    }
    else
    {
        dltText.innerText = "Do you want to delete selected students?";
        dltButton.addEventListener("click", function() {
            deleteSelected();
        });
    }

}

function closeDltModal(){
    let dltModal = document.getElementById("deleteModal");

    dltModal.classList.remove("show"); // Remove "show" class
    dltModal.classList.add("closing"); // Start slide-up animation


    // Wait for animation to complete before hiding
    setTimeout(() => {
        dltModal.classList.remove("closing"); // Reset animation state
        dltModal.style.display = "none"; // Hide modal after animation completes
    }, 500); // Must match CSS transition time (0.5s)
}


  
document.addEventListener("DOMContentLoaded", function() {
      
    /*let dashboardNav = this.document.getElementById("dashboardNav");
    if(window.innerWidth < 1000)
    {
        dashboardNav.innerHTML = "Db";
    }*/

      let bell = document.getElementById("notificationBell");
    let indicator = document.getElementById("notificationIndicator");
    let dropdown = document.getElementById("notificationDropdown");
    let userdropdown = document.getElementById("userdropdown");
    let username = document.getElementById("username");
    let notification = document.getElementById("notificationIndicator");
    bell.addEventListener("click", function() {
        indicator.style.display = "none";
        window.location.href = "tasksTab.html";
    });
    
    bell.addEventListener("mouseover", function() {
        dropdown.classList.add("show");
        bell.classList.add("bell-animate");
        notification.style.display = "none";

    });
    
    bell.addEventListener("mouseleave", function() {
            dropdown.classList.remove("show");
            bell.classList.remove("bell-animate");
    });
    
    dropdown.addEventListener("mouseover", function() {
        dropdown.classList.add("show");
    });
    
    dropdown.addEventListener("mouseleave", function() {
        dropdown.classList.remove("show");
    });



    username.addEventListener("mouseover", function(){

        userdropdown.classList.add("show");
    });

    username.addEventListener("mouseleave", function() {
        userdropdown.classList.remove("show");
    });

    userdropdown.addEventListener("mouseover", function(){
        userdropdown.classList.add("show");
    });

    userdropdown.addEventListener("mouseleave", function() {
        userdropdown.classList.remove("show");
    });
    
    var masterCheckbox = document.getElementById("masterCheckbox"); // Replace with your actual ID

    masterCheckbox.addEventListener('change', function() {
        // Select checkboxes dynamically each time the master checkbox is toggled
        var checkboxes = document.querySelectorAll(".row-checkbox");  


        checkboxes.forEach(element => {
            element.checked = masterCheckbox.checked; // Check/uncheck all
        });
    });

});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/pvi/sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("Service Worker registration failed", err));
  }