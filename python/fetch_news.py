from pygooglenews import GoogleNews
import sys
import json
import codecs

def fetch_news_summaries(queries):
    """Fetches real-time news summaries using Google News."""
    gn = GoogleNews(lang='en')
    summaries = {}

    for query in queries:
        try:
            search_results = gn.search(query, when="1y")
            articles = search_results.get("entries", [])

            summaries[query] = [
                {
                    "title": article.get("title", "No title available"),
                    "snippet": article.get("summary", "No description available"),
                    "link": article.get("link", "No URL available"),
                    "published": article.get("published", "No date available"),
                }
                for article in articles[:2]
            ]
        except Exception as e:
            summaries[query] = [{"error": str(e)}]

    return summaries

if __name__ == "__main__":
    try:
        # Set stdout encoding to UTF-8
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
        
        queries = sys.argv[1:]
        news_data = fetch_news_summaries(queries)

        formatted_news = "\n".join(
            [
                f"{query}: {item['title']} - {item['snippet']}\nPublished: {item.get('published', 'Unknown')}\nSource: {item['link']}"
                for query, articles in news_data.items()
                for item in articles
                if "error" not in item
            ]
        )
        
        # Print JSON with ensure_ascii=False to properly handle Unicode
        print(json.dumps(formatted_news, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))