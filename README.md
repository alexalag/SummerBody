# 🏃 SummerBody 🏃

Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Alexandra Lagutova | 324449 |
| Loïc Misenta | 330593 |
| Juliette Le Béchec | 346045 |

[🌐 Website](https://loicmisenta.github.io/SummerBody/) • [📄 Process Book](#milestone-3) • [🎥 Screencast](#milestone-3)

## 🌟 What is SummerBody?

SummerBody is an interactive data visualization website exploring the evolution of world athletics records.

Rather than presenting records as isolated numbers, the project places athletic performances in a broader historical, geographical, and human context. Through interactive visualizations, users can explore how world records have evolved over time, where they were achieved, who held them, and which patterns emerge across disciplines, countries, genders, and generations of athletes.

The goal is to create a playful yet immersive experience that makes athletics records easier to understand, compare, and contextualize.

## 💭 Why SummerBody?

World records are often remembered as spectacular individual achievements: a name, a time, a distance, or a date. However, behind each record lies a richer story.

SummerBody aims to reveal this hidden structure by showing:

- how performances progressed through time;
- which countries and athletes appear most often in the history of world records;
- how long some records remained unbeaten;
- how age, gender, discipline, and geography relate to record-breaking performances;
- which athletes and disciplines deserve more attention.

By combining data analysis and interactive storytelling, SummerBody helps users go beyond the final result and explore the dynamics behind athletic excellence.

## 🎯 Who is SummerBody for?

SummerBody is made for anyone interested in sports, athletics, world records, or data visualization.

Casual users can discover impressive performances and surprising facts, while more curious users can explore deeper trends across time, countries, athletes, and disciplines.

## 🚀 Website

The final website is available here:

[🏃 Go to SummerBody 🏃](https://loicmisenta.github.io/SummerBody/)

## 🛠️ Running the Project Locally

The website is static and can be run locally without installing a backend.

To run the project locally:

1. Clone the repository.

```bash
git clone https://github.com/com-480-data-visualization/SummerBody.git
cd SummerBody
```

2. Go to the website folder.

```bash
cd final_website
```

3. Start a local HTTP server.

```bash
python3 -m http.server 8000
```

4. Open the website in your browser.

```text
http://localhost:8000
```


## 📁 Project Structure

```text
SummerBody/
├── final_website/          
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── duel.js
│   │   ├── world-map.js
│   │   ├── world-record-podium.js
│   │   ├── record-reigns.js
│   │   ├── render-sections.js
│   │   ├── data-loader.js
│   │   ├── nation-meta.js
│   │   └── utils.js
│   └── assets/
│       ├── data/          
│       └── img/
│
├── data/
│   ├── processed/
│   │   └── final_data.csv        
│   └── raw/
│       ├── data.csv
│       └── worldrecords.csv 
│
├── visualizations_data/
│   ├── bar_graph_ath_nat/
│   ├── duel_athletes/
│   ├── duel_years/
│   ├── gap_record/
│   ├── map_records/
│   ├── mean_age/
│   ├── pie_chart_gen/
│   ├── record_progression/
│   ├── side_by_side_bar_graph_age_gen/
│   └── top_wr_holders/
│
├── previous_work/
│   ├── notebook_alex.ipynb
│   ├── notebook_lomimi.ipynb
│   ├── notebook_ju.ipynb
│   └── original_website/
│
├── Milestone1-SummerBody.pdf
├── Milestone2-SummerBody.pdf
└── worldrecords.csv
```

## 📊 Dataset

The dataset was found on the [Kaggle website](https://www.kaggle.com/datasets/mexwell/world-athletics-database?select=worldrecords.csv).

Only the `data.csv` file was used, as it gathers the relevant information from the original athletics database files.

The raw file [`data.csv`](data/raw/data.csv) was cleaned in Python using the notebooks available in [`previous_work/`](previous_work/) to produce the final processed CSV file: [`final_data.csv`](data/processed/final_data.csv).

During preprocessing, additional computed fields were added, such as athlete age at the time of the performance. Some fields were also cleaned and standardized, including information about the venue and country of each competition.

## 💻 Technical Information

The website was built using:

- HTML, CSS and Vanilla JavaScript
- D3.js for the visualizations
- PapaParse for CSV parsing in the browser
- Python and Jupyter notebooks for data cleaning and preprocessing

## 📍 Milestones

- [Milestone 1](Milestone1-SummerBody.pdf): project proposal, dataset description, and initial ideas.
- [Milestone 2](Milestone2-SummerBody.pdf): prototype, design choices, and planned visualizations.
- [Milestone 3](#milestone-3): final report, website, and screencast.

## 📄 Milestone 3

The final submission includes the process book, the final website, and the screencast video.

- [Process Book](Milestone3-SummerBody.pdf)
- [Screencast](#)

## 🤝 Authors

- Alexandra Lagutova
- Loïc Misenta
- Juliette Le Béchec