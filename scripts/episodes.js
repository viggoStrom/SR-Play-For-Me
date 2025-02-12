
const episodesUL = document.getElementById("new-episodes");

// Gets all the episodes from the API origin
const fetchEpisodes = (programIDs) => {
    const episodes = [];

    programIDs.forEach((id) => {

        // The API requires a date range so I set it to a week back and a day forward
        const fromDate = new Date(new Date().getTime() - 604800000).toISOString().slice(0, 10);
        const toDate = new Date(new Date().getTime() + 86400000).toISOString().slice(0, 10)

        fetch(`https://api.sr.se/api/v2/episodes/index?programid=${id.replace(/[^0-9]/g, '')}&fromdate=${fromDate}&todate=${toDate}&audioquality=hi&format=json&pagination=false`)
            .then(response => response.json())
            .then(data => {
                data.episodes.forEach(episode => {
                    episodes.push({
                        id: "episode" + episode.id,
                        title: episode.title || "Avsnittstitel saknas",
                        description: episode.description || "Beskrivning saknas",
                        programName: episode.program.name || "Programnamn saknas",
                        image: episode.imageurltemplate || episode.imageurl || "../assets/icons/missing-image48.png",
                        duration: episode.downloadpodfile.duration || episode.listenpodfile.duration,
                        audioURL: episode.downloadpodfile.url || episode.listenpodfile.url,
                        publishDate: parseInt(episode.downloadpodfile.publishdateutc.replace(/[^0-9]/g, '')),
                    })
                });
            }).then(() => {
                // Set the episodes in local storage and sort them by publish date
                localStorage.setItem("episodes", JSON.stringify(episodes.sort((a, b) => b.publishDate - a.publishDate)));
                makeEpisodeDOMS(episodes)

            }).catch(error => {
                console.warn("Error fetching episodes:", error);
            });
    });
}

// Goes through the episodes and set their progress bars according to their progress in local storage
const reProgressEpisodes = (episodes) => {
    episodes.forEach((episode, index) => {
        const progressBar = document.getElementById(episode.id).querySelector(".progress-bar");

        const duration = progressBar.getAttribute("data-duration");
        const progress = localStorage.getItem(episode.id) || 0;

        if (progress > 0) {
            progressBar.style.backgroundSize = `${progress / duration * 100 + 3}%`;
        } else if (progress === 0) {
            progressBar.style.backgroundSize = "0%";
        }
    });
}

const makeEpisodeDOMS = (episodes) => {
    episodesUL.innerHTML = "";

    const getDisplayDate = (date) => {
        if (new Date(date).toDateString() === new Date().toDateString()) {
            return "Idag"
        } else if (new Date(date).toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()) {
            return "Igår"
        } else {
            return new Date(date).toLocaleString("sv-SE", { day: "2-digit", month: "short" }).replace("0", "").replace(".", "");
        }
    }
    const getTime = (date) => {
        return new Date(date).toLocaleString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    }
    const getDuration = (duration) => {
        return Math.round(duration / 60) + " MIN";
    }
    const setMetaData = (episode) => {
        return `${getDisplayDate(episode.publishDate)} &nbsp; | &nbsp; ${getTime(episode.publishDate)} &nbsp; • &nbsp; ${getDuration(episode.duration)}`;
    }

    // Makes the html elements for each episode
    episodes.forEach(episode => {
        const li = document.createElement("li");
        li.id = episode.id;

        const imgDiv = document.createElement("div");
        imgDiv.classList.add("img-wrapper");
        const img = document.createElement("img");
        img.classList.add("episode-image");
        img.loading = "lazy";
        img.src = episode.image;
        img.alt = "Bild";
        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar");
        progressBar.setAttribute("data-duration", episode.duration);
        progressBar.style.backgroundSize = "0%";
        imgDiv.appendChild(img);
        imgDiv.appendChild(progressBar);

        const program = document.createElement("p");
        program.classList.add("program-name");
        program.textContent = episode.programName;

        const title = document.createElement("p");
        title.classList.add("title");
        title.textContent = episode.title;

        const description = document.createElement("p");
        description.classList.add("description");
        description.textContent = episode.description;

        const metaData = document.createElement("p");
        metaData.classList.add("meta-data");
        metaData.innerHTML = setMetaData(episode);

        const playButton = document.createElement("div");
        playButton.classList.add("play-button");
        playButton.setAttribute("data-audio-src", episode.audioURL);
        playButton.setAttribute("onclick", "playThis(this.parentElement.id)");
        
        const playIcon = document.createElement("img");
        playIcon.src = "../assets/icons/play_arrow_24dp_000000_FILL1_wght400_GRAD0_opsz24.png";
        playIcon.alt = "▶";
        playButton.appendChild(playIcon);

        const contextMenu = document.createElement("p");
        contextMenu.classList.add("context-menu");
        contextMenu.textContent = "•••";
        contextMenu.setAttribute("onclick", "toggleContextMenu(this)");

        li.appendChild(imgDiv);
        li.appendChild(program);
        li.appendChild(title);
        li.appendChild(description);
        li.appendChild(metaData);
        li.appendChild(playButton);
        li.appendChild(contextMenu);

        episodesUL.appendChild(li);
    });

    reProgressEpisodes(episodes);
};

// Context menu refers to the menu that appears when you click on the three dots on an episode
const toggleContextMenu = (source) => {
    const contextMenu = document.getElementById("context-menu");
    contextMenu.style.display = "flex";
    contextMenu.style.position = "absolute";
    contextMenu.setAttribute("data-episode-id", source.parentElement.id);

    const rect = source.getBoundingClientRect();
    contextMenu.style.right = `calc(107% - ${rect.right}px)`;
    contextMenu.style.top = `calc(${rect.top}px - 1%)`;


    const hideOnClick = (event) => {
        if (event.target !== source && event.target !== contextMenu) {
            contextMenu.style.display = "none";
            document.removeEventListener("click", hideOnClick);
        };
    };

    document.addEventListener("click", hideOnClick);
};

// A button in the context menu uses this function to mark an episode as listened to
const markAsListenedTo = (source) => {
    const contextMenu = source.parentElement;
    const episode = document.getElementById(contextMenu.getAttribute("data-episode-id"));
    if (episode.id === localStorage.getItem("currentlyPlaying")) {
        mainAudioPlayer.src = "";
        mainAudioPlayer.currentTime = 0;
        localStorage.removeItem("currentlyPlaying");
    };

    localStorage.setItem(contextMenu.getAttribute("data-episode-id"), episode.querySelector(".progress-bar").getAttribute("data-duration"));

    const episodes = JSON.parse(localStorage.getItem("episodes"));
    reProgressEpisodes(episodes);
}

// A button in the context menu uses this function to reset the progress of an episode
const resetProgressAt = (source) => {
    const contextMenu = source.parentElement;
    const episode = document.getElementById(contextMenu.getAttribute("data-episode-id"));
    if (episode.id === localStorage.getItem("currentlyPlaying")) {
        mainAudioPlayer.src = "";
        mainAudioPlayer.currentTime = 0;
        localStorage.removeItem("currentlyPlaying");
    };

    localStorage.removeItem(contextMenu.getAttribute("data-episode-id"));

    const episodes = JSON.parse(localStorage.getItem("episodes"));
    reProgressEpisodes(episodes);
}

const episodesOnload = () => {

    // If you haven't liked any programs, a notification will appear
    if (localStorage.getItem("liked")) { document.getElementById("no-fav-notification").style.display = "none" }

    // Liked program ids
    const liked = JSON.parse(localStorage.getItem("liked")) || [];

    // Liked program objects
    const programs = localStorage.getItem("programs");

    if (programs) {
        fetchEpisodes(liked);
    } else {
        // if there are no programs in local storage, fetch them first
        fetchPrograms().then(() => {
            fetchEpisodes(liked);
        });
    }
}

episodesOnload();