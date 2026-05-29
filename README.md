# SummerBody - Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Alexandra Lagutova | 324449 |
| Loïc Misenta | 330593 |
| Juliette Le Béchec | 346045 |

[Milestone 1](Milestone1-SummerBody.pdf) • [Milestone 2](Milestone2-SummerBody.pdf) • [Milestone 3](#milestone-3)

SummerBody explores the evolution of world athletics records through immersive and interactive data storytelling. The website aims to create a playful yet immersive visualization experience allowing users to contextualize athletic performances within larger historical, geographical, and human narratives.

Instead of presenting records as isolated statistics, the website highlights patterns linked to performance progression, explores the evolution of athletic achievements and displays patterns behind world records while showcasing promising athletes and lesser-known disciplines.

The final report and screencast of the video can be found here : [Milestone 3](#milestone-3).

## Project Structure
```
SummerBody/
├── final_website/          
│   ├── index.html
│   ├── css/style.css
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
│   ├── processed/final_data.csv        
│   └── raw
│       ├── final_data.csv
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

## Dataset
The dataset was found on the [Kaggle Website](https://www.kaggle.com/datasets/mexwell/world-athletics-database?select=worldrecords.csv). Only the data.csv file was used, as it gathers all of the information of the 98 other files.

The raw file [data.csv](data/raw/data.csv) was cleaned in Python in the [notebooks](previous_work/) to produce the csv: [final_data.csv](data/processed/final_data.csv).
Computed fields such as athlete age were added, and a column gathering information about the "Venue" and the "Country" of the competed event into two.

## Technical Information
### Technologies Used
• HTML, CSS and Vanilla JS\
• D3.js — for the visualizations\
• PapaParse — CSV parsing in browser

### Running the Project
[...]

