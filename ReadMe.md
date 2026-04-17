
####
webscraper/
├── index.js              # Express server and route handlers
├── googleSearch.js       # Search aggregator (DuckDuckGo, Wikipedia, Open Library)
├── views/
│   └── index.ejs         # Frontend template (Bootstrap 4)
├── package.json
└── README.md

Installation
bash# Clone the repository
git clone <your-repo-url>
cd webscraper

# Install dependencies
npm install

#Dependencies
bashnpm install express ejs axios cheerio

#Run the App
bashnode index.js

#Then open your browser and go to:
http://localhost:5000

##Search Fallback Chain 

DuckDuckGo Instant Answer
        ↓ (if no description)
Wikipedia REST API
        ↓ (if still no data)
Open Library API


##🧩 Data Sources

##🦆 DuckDuckGo
#General search results
#Quick summaries
#Alternative to Google scraping

##📖 Wikipedia
#Reliable topic descriptions
#Structured summaries
#Multi-language support

##📚 Open Library
#Book-related data
#Author and publication references

###📋 Knowledge Panel Fields
## FieldDescription
# Title - The name of the topic
# Description - A summary from the best available source
#Image - Thumbnail from DuckDuckGo or Wikipedia
#URL - Reference link to the source
#Metadata - Infobox data e.g. Born, Occupation, Years active