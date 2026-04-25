
from langchain_groq import ChatGroq

agent = ChatGroq(
        model= "llama-3.1-8b-instant",
        temperature=0.4
    )

m=agent.invoke('Tell me some fun facts about Amritsar')
print(m.content)
