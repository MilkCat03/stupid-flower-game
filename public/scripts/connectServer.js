window.connected = false;

fetch('https://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev:3000/connect')
    .then(response => {
        if (response.ok) {
            connected = true;
            console.log('Connected to server');
            
        } else {
            throw new Error(`Server response not OK. Status: ${response.status} ${response.statusText}`);
        }
    })
    .catch(error => {
        errorHandler(error);
    });

function errorHandler(error) {
    const errorDetails = `
        <h1 style="color: red; text-align: center; margin-bottom: 16px;">Error: Unable to connect to the server.</h1>
        <div style="color: #fff; text-align: center;">
            <p><strong>Details:</strong></p>
            <pre style="background:#222; color:#fff; padding:12px; border-radius:8px; display:inline-block;">${error.message}</pre>
            <p>Make sure your server is running at <code>http://localhost:3000</code>.</p>
            <p>If you just started the server, wait a few seconds and refresh.</p>
            <p>If the problem persists, check your firewall or network settings.</p>
        </div>
    `;
    document.body.innerHTML = errorDetails;
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#fff';
    document.body.style.fontFamily = 'sans-serif';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
}
