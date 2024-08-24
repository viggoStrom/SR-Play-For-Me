
// Snap scrollbar back to hide refresh button
main.addEventListener("scroll", () => {
    if (main.scrollTop < 36) {
        setTimeout(() => {
            if (main.scrollTop < 36) {
                main.scrollTop = 36;
            }
        }, 1000);
    }
})


window.onload = () => {

    // Set lastFetch if undefined
    if (localStorage.getItem("lastFetch") === null) {
        localStorage.setItem("lastFetch", Date.now())
    }

    // Fetch programs if undefined
    if (localStorage.getItem("programs") === null) {
        fetchPrograms()
    } else {
        populateUL()
    }

    // Fetch programs if last fetch was more than 12 hours ago
    if (localStorage.getItem("lastFetch")) {
        const lastFetch = parseInt(localStorage.getItem("lastFetch"))
        const currentTime = parseInt(Date.now())

        if (currentTime - lastFetch > 1000 * 60 * 60 * 12) { // 12 hours in milliseconds
            fetchPrograms()
            localStorage.setItem("lastFetch", Date.now())
        }
    }
}

const searchBox = document.querySelector('.search-box');
searchBox.addEventListener("input", () => {
    sort();
})