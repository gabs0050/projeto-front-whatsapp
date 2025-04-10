'use strict'

document.addEventListener('DOMContentLoaded', () => {
    const contactsList = document.getElementById('contacts-list')
    const contactInfo = document.getElementById('contact-info')
    const messagesContainer = document.getElementById('messages-container')
    const contactSearch = document.getElementById('contact-search')
    const messageInput = document.getElementById('message-input')
    const sendButton = document.getElementById('send-button')
    const userNumber = '11987876567'
    const baseImageUrl = 'https://api-whatsapp-xlr1.onrender.com/'

    let allContacts = []
    let currentContact = null

    contactSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase()
        const filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) || 
            (contact.description && contact.description.toLowerCase().includes(searchTerm))
        )
        renderContacts(filteredContacts)
    })

    sendButton.addEventListener('click', sendMessage)
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage()
        }
    })

    function sendMessage() {
        if (!currentContact || !messageInput.value.trim()) return
        
        const newMessage = {
            content: messageInput.value.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'me'
        }
        
        currentContact.messages.push(newMessage)
        
        loadChat(currentContact)
        
        messageInput.value = ''
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    async function loadContacts() {
        try {
            contactsList.textContent = 'Carregando contatos...'
            contactsList.className = 'loading-message'
            
            const contactsResponse = await fetch(`https://api-whatsapp-xlr1.onrender.com/v1/whatsapp/contatoUsuario?number=${userNumber}`)
            const contactsData = await contactsResponse.json()
            
            const chatsResponse = await fetch(`https://api-whatsapp-xlr1.onrender.com/v1/whatsapp/conversasUsuario?number=${userNumber}`)
            const chatsData = await chatsResponse.json()
            
            allContacts = combineContactData(contactsData.contacts, chatsData.contacts)
            renderContacts(allContacts)
            
            if (allContacts.length > 0) {
                currentContact = allContacts[0]
                loadChat(currentContact)
            }
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error)
            const errorMsg = document.createElement('p')
            errorMsg.className = 'empty-message'
            errorMsg.textContent = 'Erro ao carregar contatos'
            contactsList.replaceChildren(errorMsg)
        }
    }

    function combineContactData(basicContacts, detailedContacts) {
        return basicContacts.map(basicContact => {
            const detailedContact = detailedContacts.find(c => c.name === basicContact.name) || {}
            return {
                ...basicContact,
                messages: detailedContact.messages || [],
                image: basicContact.image.startsWith('http') 
                    ? basicContact.image 
                    : `${baseImageUrl}${basicContact.image.replace(/^\/?/, '')}`
            }
        })
    }

    function renderContacts(contacts) {
        contactsList.replaceChildren()
        
        if (contacts.length === 0) {
            const emptyMsg = document.createElement('p')
            emptyMsg.className = 'empty-message'
            emptyMsg.textContent = 'Nenhum contato encontrado'
            contactsList.appendChild(emptyMsg)
            return
        }
        
        contacts.forEach(contact => {
            const contactElement = document.createElement('div')
            contactElement.className = 'contact'
            
            const avatarDiv = document.createElement('div')
            avatarDiv.className = 'contact-avatar'
            
            const avatarImg = document.createElement('img')
            avatarImg.src = contact.image
            avatarImg.alt = contact.name
            avatarImg.onerror = function() {
                this.onerror = null
                this.src = `https://via.placeholder.com/50/cccccc/999999?text=${contact.name.charAt(0)}`
            }
            avatarDiv.appendChild(avatarImg)
            
            const infoDiv = document.createElement('div')
            
            const nameDiv = document.createElement('div')
            nameDiv.className = 'contact-name'
            nameDiv.textContent = contact.name
            
            const lastMsgDiv = document.createElement('div')
            lastMsgDiv.className = 'contact-last-msg'
            lastMsgDiv.textContent = contact.messages?.length > 0 
                ? contact.messages[contact.messages.length - 1].content 
                : contact.description || 'Nenhuma mensagem'
            
            infoDiv.appendChild(nameDiv)
            infoDiv.appendChild(lastMsgDiv)
            
            contactElement.appendChild(avatarDiv)
            contactElement.appendChild(infoDiv)
            
            contactElement.addEventListener('click', () => {
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'))
                contactElement.classList.add('active')
                currentContact = contact
                loadChat(contact)
            })
            
            if (currentContact && contact.name === currentContact.name) {
                contactElement.classList.add('active')
            }
            
            contactsList.appendChild(contactElement)
        })
    }

    function loadChat(contact) {
        messagesContainer.replaceChildren()
        currentContact = contact
        
        updateChatHeader(contact)
        
        if (!contact.messages || contact.messages.length === 0) {
            const emptyMsg = document.createElement('p')
            emptyMsg.className = 'empty-message'
            emptyMsg.textContent = 'Nenhuma mensagem encontrada'
            messagesContainer.appendChild(emptyMsg)
            return
        }
        
        contact.messages.forEach(msg => {
            const messageElement = document.createElement('div')
            const isSent = msg.sender === 'me' || msg.sender === userNumber
            
            messageElement.className = `message ${isSent ? 'sent' : 'received'}`
            
            const contentDiv = document.createElement('div')
            contentDiv.textContent = msg.content
            
            const timeDiv = document.createElement('div')
            timeDiv.className = 'message-time'
            timeDiv.textContent = msg.time
            
            messageElement.appendChild(contentDiv)
            messageElement.appendChild(timeDiv)
            
            messagesContainer.appendChild(messageElement)
        })
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    function updateChatHeader(contact) {
        contactInfo.replaceChildren()
        
        const avatarDiv = document.createElement('div')
        avatarDiv.className = 'chat-header-avatar'
        
        const avatarImg = document.createElement('img')
        avatarImg.src = contact.image
        avatarImg.alt = contact.name
        avatarImg.onerror = function() {
            this.onerror = null
            this.src = `https://via.placeholder.com/40/cccccc/999999?text=${contact.name.charAt(0)}`
        }
        avatarDiv.appendChild(avatarImg)
        
        const infoDiv = document.createElement('div')
        infoDiv.className = 'chat-header-info'
        
        const nameH3 = document.createElement('h3')
        nameH3.textContent = contact.name
        
        const descP = document.createElement('p')
        descP.textContent = contact.description
        
        infoDiv.appendChild(nameH3)
        infoDiv.appendChild(descP)
        
        contactInfo.appendChild(avatarDiv)
        contactInfo.appendChild(infoDiv)
    }

    loadContacts()
})