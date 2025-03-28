function Student(group, name, gender, birth, status){
    this.group = group;
    this.name = name;
    this.gender = gender;
    this.birth = birth;
    this.status = status;
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
    document.getElementById("name").value = "";
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
        let name = document.getElementById("name");
        let gender = document.getElementById("genderDropdown");
        let birth = document.getElementById("birthday");
        group.value = row.cells[1].textContent;
        name.value = row.cells[2].textContent;
        gender.value = row.cells[3].textContent;
        birth.value = row.cells[4].textContent;
        document.getElementById("headerModal").innerHTML = "Change info";
        document.getElementById("addStudent").innerHTML = "Change";
    }
    else
    {
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
}

function AddStudent(){

    let table = document.getElementById("table"); 
    let newRow = table.insertRow(); 

    let group = document.getElementById("groupDropdown").value;
    let name = document.getElementById("name").value;
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value;
    let status;

    if (!group || !name || !gender || !birth) {
        alert("Please fill in all fields before adding a student!");
        return; // Stop function execution
    }
    if(!validateInput(name))
    {
        alert("Write valid input for name field!");
        return;
    }
    if(name == document.getElementById("username").innerHTML)
        status = "online";
    else
        status = "offline";

    students[studentsCount] = new Student(group, name, gender, birth, status);

    newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;

    newRow.insertCell(1).textContent = group;
    newRow.insertCell(2).textContent = name;
    newRow.insertCell(3).textContent = gender;
    newRow.insertCell(4).textContent = birth;
    newRow.insertCell(5).textContent = status;
    
    let optionsCell = newRow.insertCell(6);
    let editBtn = document.createElement("button");
    editBtn.className = "editButton editBtn";
    editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    editBtn.classList.add("editBtn");
    
    let deleteBtn = document.createElement("button");
    deleteBtn.className = "editButton editBtn";
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    deleteBtn.classList.add("deleteBtn");
    
    optionsCell.appendChild(editBtn);
    optionsCell.appendChild(deleteBtn);
    closeModal();

    deleteBtn.addEventListener("click", function() {
        openDltModal(newRow, 1);
        //able.deleteRow(newRow.rowIndex);
    });

    editBtn.addEventListener("click", function(){
        openModal(1, newRow);
    });

    
}

function OkButtonClick(){

    let table = document.getElementById("table"); 
    let newRow = table.insertRow(); 

    let group = document.getElementById("groupDropdown").value;
    let name = document.getElementById("name").value;
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value;
    let status;

    if (!group || !name || !gender || !birth) {
        
        closeModal();
        return; // Stop function execution
    }
    if(!validateInput(name))
        {
            alert("Write valid input for name field!");
            return;
        }
    if(name == document.getElementById("username").innerHTML)
        status = "online";
    else
        status = "offline";

    students[studentsCount] = new Student(group, name, gender, birth, status);

    newRow.insertCell(0).innerHTML = `<input type="checkbox" class="row-checkbox">`;

    newRow.insertCell(1).textContent = group;
    newRow.insertCell(2).textContent = name;
    newRow.insertCell(3).textContent = gender;
    newRow.insertCell(4).textContent = birth;
    newRow.insertCell(5).textContent = status;
    
    let optionsCell = newRow.insertCell(6);
    let editBtn = document.createElement("button");
    editBtn.className = "editButton editBtn";
    editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    editBtn.classList.add("editBtn");
    
    let deleteBtn = document.createElement("button");
    deleteBtn.className = "editButton editBtn";
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    deleteBtn.classList.add("deleteBtn");
    
    optionsCell.appendChild(editBtn);
    optionsCell.appendChild(deleteBtn);
    closeModal();

    deleteBtn.addEventListener("click", function() {
        openDltModal(newRow, 1);
        //able.deleteRow(newRow.rowIndex);
    });

    editBtn.addEventListener("click", function(){
        openModal(1, newRow);
    });
    
    
}

function validateInput(input) {
    const pattern = /^[a-zA-Z0-9-]{1,30}$/;
    return pattern.test(input);
  }

function editStudent(row)
{
    let group = document.getElementById("groupDropdown").value;
    let name = document.getElementById("name").value;
    let gender = document.getElementById("genderDropdown").value;
    let birth = document.getElementById("birthday").value;

    row.cells[1].textContent = group;
    if(!validateInput(name))
    {
        alert("Write valid input for name field!");
        return;
    }
    row.cells[2].textContent = name;
    row.cells[3].textContent = gender;
    row.cells[4].textContent = birth;

    let studentData = {
        group: row.cells[1].textContent,
        name: row.cells[2].textContent,
        gender: row.cells[3].textContent,
        birth: row.cells[4].textContent
    };
    
    let jsonString = JSON.stringify(studentData);
    console.log(jsonString);
     
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