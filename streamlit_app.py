import streamlit as st
import google.generativeai as genai

# --- PAGE SETUP ---
st.set_page_config(page_title="Vocab Master", page_icon="🤖")
st.title("Vocab Master Bot")

# --- API SETUP ---
# We will set this securely in the next step!
try:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
except Exception:
    st.error("Missing API Key! Please add it to Streamlit Secrets.")

# --- MODEL SETUP (Copy your specific settings from Google AI Studio here) ---
# Paste your 'generation_config' and 'safety_settings' variables here if you have specific ones.
# Otherwise, we use defaults:
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash", # Or whichever model you chose
    generation_config=generation_config,
)

# --- CHAT HISTORY ---
if "chat_session" not in st.session_state:
    st.session_state.chat_session = model.start_chat(history=[])

# Display chat history
for message in st.session_state.chat_session.history:
    with st.chat_message("user" if message.role == "user" else "assistant"):
        st.markdown(message.parts[0].text)

# --- USER INPUT ---
user_input = st.chat_input("Type your message here...")

if user_input:
    # 1. Display user message
    with st.chat_message("user"):
        st.markdown(user_input)
    
    # 2. Send to Gemini
    try:
        response = st.session_state.chat_session.send_message(user_input)
        
        # 3. Display AI response
        with st.chat_message("assistant"):
            st.markdown(response.text)
            
    except Exception as e:
        st.error(f"Error: {e}")
