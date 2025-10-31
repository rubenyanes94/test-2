/**
 * Routine Flow - script.js
 * Lógica de la aplicación con gestión de calendario, tareas y VISTAS MÚLTIPLES
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales ACTUALIZADAS ---
    let tasksData = loadTasks();
    let currentView = 'month'; // 'month', 'week', 'day'
    let currentStartDate = new Date(); // Fecha de enfoque para la navegación
    currentStartDate.setHours(0, 0, 0, 0); 
    const userId = generateUserId();
    
    // --- Referencias a Elementos del DOM ACTUALIZADAS ---
    const calendarGrid = document.getElementById('calendar-grid');
    const currentViewDisplay = document.getElementById('current-view-display'); 
    const prevBtn = document.getElementById('prev-btn'); 
    const nextBtn = document.getElementById('next-btn');
    
    // Selectores de vista (NUEVOS)
    const viewMonthBtn = document.getElementById('view-month');
    const viewWeekBtn = document.getElementById('view-week');
    const viewDayBtn = document.getElementById('view-day');

    const tasksDateDisplay = document.getElementById('tasks-date-display');
    const tasksList = document.getElementById('tasks-list');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const aiOutput = document.getElementById('ai-output');
    const getAiRecommendationBtn = document.getElementById('get-ai-recommendation');
    const evaluationOutput = document.getElementById('evaluation-output');
    const runMonthlyEvaluationBtn = document.getElementById('run-monthly-evaluation');
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    const loadingText = document.getElementById('loading-text');


    // --- Inicialización ---
    document.getElementById('status-message').textContent = "Aplicación lista. ¡Empecemos!";
    document.getElementById('user-id-display').textContent = `ID de Usuario (Simulado): ${userId}`;

    // ----------------------------------------------------
    // --- 1. Lógica de Persistencia y Utilidades ---
    // ----------------------------------------------------

    function generateUserId() {
        if (!localStorage.getItem('routineFlowUserId')) {
            localStorage.setItem('routineFlowUserId', 'RF-' + Math.random().toString(36).substr(2, 9).toUpperCase());
        }
        return localStorage.getItem('routineFlowUserId');
    }

    function loadTasks() {
        try {
            const data = localStorage.getItem('routineFlowTasks');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Error al cargar tareas:", e);
            return {};
        }
    }

    function saveTasks() {
        localStorage.setItem('routineFlowTasks', JSON.stringify(tasksData));
    }

    function formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }
    
    function formatDateDisplay(date) {
        // Formato para mostrar la fecha: Viernes, 31 de octubre de 2025
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ----------------------------------------------------
    // --- 2. Lógica del Calendario y Vistas ---
    // ----------------------------------------------------
    
    // --- Lógica de la Vista Mensual ---
    function renderMonthView() {
        calendarGrid.className = 'calendar-grid'; // Aplica el CSS de cuadrícula mensual
        calendarGrid.innerHTML = '';
        
        const year = currentStartDate.getFullYear();
        const month = currentStartDate.getMonth();
        
        currentViewDisplay.textContent = new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

        // Nombres de los días (Lun a Dom)
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayNames.forEach(name => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.classList.add('day-name');
            dayNameDiv.textContent = name;
            calendarGrid.appendChild(dayNameDiv);
        });
        
        // Determinar el Lunes de la primera semana visible
        const firstOfMonth = new Date(year, month, 1);
        let startDay = new Date(firstOfMonth);
        const dayOfWeek = firstOfMonth.getDay(); // 0=Dom, 1=Lun
        // Si es 0 (Dom), queremos que retroceda 6 días para empezar el Lunes anterior
        const startOffset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; 
        startDay.setDate(firstOfMonth.getDate() - startOffset);

        const todayKey = formatDateKey(new Date());

        // Renderizar 6 semanas (42 días)
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDay);
            date.setDate(startDay.getDate() + i);
            const dateKey = formatDateKey(date);
            
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.innerHTML = `<span class="fw-semibold">${date.getDate()}</span>`; // Número en negrita
            dayDiv.dataset.date = dateKey;

            // Días fuera del mes actual
            if (date.getMonth() !== month) {
                dayDiv.classList.add('text-muted');
            }

            if (dateKey === todayKey) {
                dayDiv.classList.add('today');
            }
            // Verifica si el día es el seleccionado, ignorando la hora
            if (dateKey === formatDateKey(currentStartDate)) { 
                dayDiv.classList.add('selected'); 
            }

            if (tasksData[dateKey] && tasksData[dateKey].length > 0) {
                dayDiv.classList.add('has-tasks');
            }

            dayDiv.addEventListener('click', () => selectDate(date));
            calendarGrid.appendChild(dayDiv);
        }
    }

    // --- Lógica de la Vista Semanal ---
    function renderWeekView() {
        calendarGrid.className = 'calendar-week-grid';
        calendarGrid.innerHTML = '';

        // Encontrar el Lunes de la semana de currentStartDate
        const dayOfWeek = currentStartDate.getDay(); // 0=Dom, 1=Lun
        const startOffset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; 
        const weekStart = new Date(currentStartDate);
        weekStart.setDate(currentStartDate.getDate() - startOffset);
        weekStart.setHours(0, 0, 0, 0);

        // Calcular el final de la semana
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Mostrar rango de fechas
        const startMonthDay = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const endMonthDay = weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        currentViewDisplay.textContent = `${startMonthDay} - ${endMonthDay}, ${weekStart.getFullYear()}`;

        // 1. Encabezado (Horas + Días)
        calendarGrid.innerHTML += `<div class="time-slot-header"></div>`; // Esquina superior izquierda
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const todayKey = formatDateKey(new Date());
            const isToday = formatDateKey(day) === todayKey ? 'today' : '';

            // Mostrar: Lun 28
            calendarGrid.innerHTML += `<div class="day-header ${isToday}">${dayNames[i]} ${day.getDate()}</div>`;
        }

        // 2. Celdas de tiempo (00:00 a 23:30) - Renderiza cada media hora (48 slots)
        for (let hour = 0; hour < 24; hour++) {
            // Label de hora (ej: 09:00)
            const hourLabel = hour.toString().padStart(2, '0') + ':00';
            calendarGrid.innerHTML += `<div class="time-slot hour-label">${hourLabel}</div>`;
            
            // 7 celdas para los días (columna 2 a 8) para la hora exacta (ej: 09:00)
            for (let day = 0; day < 7; day++) {
                calendarGrid.innerHTML += `<div class="time-slot"></div>`; 
            }

            // Slot de media hora (ej: 09:30) - Etiqueta vacía
            if (hour < 23) {
                 calendarGrid.innerHTML += `<div class="time-slot hour-label"></div>`;
                 // 7 celdas para los días (columna 2 a 8) para la media hora (ej: 09:30)
                for (let day = 0; day < 7; day++) {
                    calendarGrid.innerHTML += `<div class="time-slot"></div>`; 
                }
            }
        }
    }

    // --- Lógica de la Vista Diaria ---
    function renderDayView() {
        calendarGrid.className = 'calendar-day-grid';
        calendarGrid.innerHTML = '';

        const fullDateDisplay = formatDateDisplay(currentStartDate);
        currentViewDisplay.textContent = fullDateDisplay;
        
        // 1. Encabezado (Horas + Día)
        calendarGrid.innerHTML += `<div class="time-slot-header"></div>`;
        const todayKey = formatDateKey(new Date());
        const isToday = formatDateKey(currentStartDate) === todayKey ? 'today' : '';
        calendarGrid.innerHTML += `<div class="day-header ${isToday}">${fullDateDisplay}</div>`;

        // 2. Celdas de tiempo (00:00 a 23:30) - Renderiza cada media hora (48 slots)
        for (let hour = 0; hour < 24; hour++) {
            // Label de hora (ej: 09:00)
            const hourLabel = hour.toString().padStart(2, '0') + ':00';
            calendarGrid.innerHTML += `<div class="time-slot hour-label">${hourLabel}</div>`;
            
            // Celda del día (columna 2) para la hora exacta
            calendarGrid.innerHTML += `<div class="time-slot"></div>`; 

            // Slot de media hora (ej: 09:30) - Etiqueta vacía
            if (hour < 23) {
                 calendarGrid.innerHTML += `<div class="time-slot hour-label"></div>`;
                 // Celda del día (columna 2) para la media hora
                calendarGrid.innerHTML += `<div class="time-slot"></div>`; 
            }
        }
    }

    // --- Función Principal de Renderizado ---
    function renderCalendar() {
        switch (currentView) {
            case 'month':
                renderMonthView();
                break;
            case 'week':
                renderWeekView();
                break;
            case 'day':
                renderDayView();
                break;
        }
    }
    
    // --- Manejador de selección de día ---
    function selectDate(date) {
        // Al seleccionar un día, actualiza el foco principal
        currentStartDate = new Date(date); 
        currentStartDate.setHours(0, 0, 0, 0);

        // Al hacer clic en un día del mes, cambiamos a la vista diaria
        if (currentView === 'month') {
             changeView('day'); 
        } else {
            renderApp();
        }
    }

    // --- Navegación (Prev/Next) ---
    function navigate(direction) {
        let date = currentStartDate;
        if (currentView === 'month') {
            date.setMonth(date.getMonth() + direction);
        } else if (currentView === 'week') {
            date.setDate(date.getDate() + (direction * 7)); // Saltar 7 días
        } else if (currentView === 'day') {
            date.setDate(date.getDate() + direction); // Saltar 1 día
        }
        currentStartDate = new Date(date);
        renderApp();
    }
    
    // --- Cambio de Vista ---
    function changeView(newView) {
        if (newView !== currentView) {
            currentView = newView;
            // Actualizar botones activos
            document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
            document.getElementById(`view-${newView}`).classList.add('active');
            
            renderApp();
        }
    }

    // --- Manejadores de Eventos del Calendario ---
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    // Manejadores de Cambio de Vista
    viewMonthBtn.addEventListener('click', () => changeView('month'));
    viewWeekBtn.addEventListener('click', () => changeView('week'));
    viewDayBtn.addEventListener('click', () => changeView('day'));


    // ----------------------------------------------------
    // --- 3. Lógica de Tareas (To-Do List) ---
    // ----------------------------------------------------
    
    function renderTasks() {
        tasksList.innerHTML = '';
        const dateKey = formatDateKey(currentStartDate);
        const dailyTasks = tasksData[dateKey] || [];
        
        // Actualizar el título de la lista de tareas
        const formattedDate = formatDateDisplay(currentStartDate);
        tasksDateDisplay.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        if (dailyTasks.length === 0) {
            noTasksMessage.style.display = 'block';
        } else {
            noTasksMessage.style.display = 'none';
            dailyTasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.classList.add('task-item', 'd-flex', 'align-items-center');
                if (task.completed) li.classList.add('task-completed');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.classList.add('form-check-input', 'me-3');
                checkbox.addEventListener('change', () => toggleTaskCompletion(dateKey, index));

                const span = document.createElement('span');
                span.classList.add('task-text', 'me-auto');
                span.textContent = task.description;

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn', 'btn-outline-danger', 'btn-sm');
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.addEventListener('click', () => deleteTask(dateKey, index));
                
                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(deleteBtn);
                tasksList.appendChild(li);
            });
        }
        // Vuelve a renderizar el calendario para actualizar el punto de tareas si es necesario
        if (currentView === 'month') {
             renderCalendar(); 
        }
    }

    function addTask(description) {
        const dateKey = formatDateKey(currentStartDate);
        if (!tasksData[dateKey]) {
            tasksData[dateKey] = [];
        }
        
        tasksData[dateKey].push({ description, completed: false, addedAt: new Date().toISOString() });
        saveTasks();
        renderTasks();
        newTaskInput.value = ''; 
    }
    
    function toggleTaskCompletion(dateKey, index) {
        tasksData[dateKey][index].completed = !tasksData[dateKey][index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(dateKey, index) {
        tasksData[dateKey].splice(index, 1);
        if (tasksData[dateKey].length === 0) {
            delete tasksData[dateKey]; 
        }
        saveTasks();
        renderTasks();
    }

    addTaskBtn.addEventListener('click', () => {
        const description = newTaskInput.value.trim();
        if (description) {
            addTask(description);
        }
    });
    
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });


    // ----------------------------------------------------
    // --- 4. Simulación de Funcionalidades de AI ---
    // ----------------------------------------------------

    function simulateLoading(text, duration = 1500) {
        return new Promise(resolve => {
            loadingText.textContent = text;
            loadingModal.show();
            setTimeout(() => {
                loadingModal.hide();
                resolve();
            }, duration);
        });
    }

    const aiTips = [
        "**Tip de Consistencia:** Aplica la regla de los 2 minutos: si una tarea toma menos de 2 minutos, hazla inmediatamente.",
        "**Recomendación Diaria:** Hoy, enfócate en la tarea más difícil primero (Come esa rana). Te dará impulso para el resto del día.",
        "**Tip de Productividad:** Bloquea 30 minutos sin interrupciones para una 'Deep Work' en tu proyecto principal.",
        "**Recomendación de AI (Simulada):** Hemos notado que tu hora de mayor productividad es entre las 10:00 y 12:00. Agenda tus tareas críticas en ese bloque.",
        "**Tip de Constancia:** Diseña un 'ancla de hábito': Asocia tu nueva rutina a una existente, ej: 'Después de cepillarme los dientes, reviso mi Routine Flow'."
    ];

    getAiRecommendationBtn.addEventListener('click', async () => {
        await simulateLoading("Generando recomendación de AI...", 1000);
        const randomTip = aiTips[Math.floor(Math.random() * aiTips.length)];
        aiOutput.innerHTML = `<p class="alert alert-info border-0 rounded-3 mb-0">${randomTip}</p>`;
    });

    document.getElementById('refine-task-btn').addEventListener('click', async () => {
        const task = newTaskInput.value.trim();
        if (!task) {
            alert("Por favor, introduce una tarea para desglosar.");
            return;
        }

        await simulateLoading(`Desglosando "${task}"...`, 2500);

        let refinedTasks = [
            `Paso 1: Definir objetivo claro para "${task}"`,
            `Paso 2: Recopilar todos los recursos necesarios para "${task}"`,
            `Paso 3: Realizar la primera sub-tarea de "${task}" (ej. 30 minutos)`,
        ];
        
        newTaskInput.value = '';
        const dateKey = formatDateKey(currentStartDate);
        if (!tasksData[dateKey]) tasksData[dateKey] = [];
        
        refinedTasks.forEach(description => {
            tasksData[dateKey].push({ description, completed: false, addedAt: new Date().toISOString() });
        });
        
        saveTasks();
        renderTasks();

        aiOutput.innerHTML = `<p class="alert alert-success border-0 rounded-3 mb-0">✨ **¡Tareas desglosadas!** Hemos añadido ${refinedTasks.length} sub-tareas basadas en tu entrada.</p>`;
    });

    runMonthlyEvaluationBtn.addEventListener('click', async () => {
        await simulateLoading("Analizando 30 días de consistencia...", 3000);

        let totalTasks = 0;
        let completedTasks = 0;
        for (const dateKey in tasksData) {
            tasksData[dateKey].forEach(task => {
                totalTasks++;
                if (task.completed) completedTasks++;
            });
        }

        const consistencyRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        let evaluationMessage;
        let recommendation;
        let colorClass;

        if (consistencyRate >= 75) {
            evaluationMessage = `**Consistencia Sobresaliente (${consistencyRate.toFixed(0)}% de tareas completadas).** Has demostrado una alta disciplina. ¡Excelente trabajo!`;
            recommendation = "Tu consistencia es un punto fuerte. Te recomendamos un breve descanso mental y enfocarte en un nuevo objetivo desafiante el próximo mes. No necesitas consulta, pero si quieres maximizar tu potencial, considera un 'coaching de alto rendimiento'.";
            colorClass = 'alert-success';
        } else if (consistencyRate >= 45) {
            evaluationMessage = `**Buena Consistencia (${consistencyRate.toFixed(0)}% de tareas completadas).** Estás en el camino correcto, pero hay margen de mejora.`;
            recommendation = "Tu consistencia es media, la AI sugiere **considerar una consulta de Terapia Cognitivo-Conductual (TCC)** si notas que la procrastinación o la falta de motivación persisten. Un profesional puede ayudarte a identificar barreras específicas.";
            colorClass = 'alert-warning';
        } else {
            evaluationMessage = `**Consistencia Baja (${consistencyRate.toFixed(0)}% de tareas completadas).** Hay muchas interrupciones o metas poco claras en tu rutina.`;
            recommendation = `Tu bajo índice de consistencia (${consistencyRate.toFixed(0)}%) sugiere que podrías estar experimentando dificultades. La AI **recomienda encarecidamente buscar una evaluación con un terapeuta psicológico** o consejero para explorar posibles causas subyacentes.`;
            colorClass = 'alert-danger';
        }

        evaluationOutput.innerHTML = `
            <div class="alert ${colorClass} border-0 rounded-3 mb-3">
                ${evaluationMessage}
            </div>
            <p class="small text-dark fw-medium">Recomendación Personalizada (AI):</p>
            <p class="small text-secondary">${recommendation}</p>
        `;
    });


    // --- Función de Inicio de la Aplicación ---
    function renderApp() {
        renderCalendar(); 
        renderTasks();
    }
    
    // Ejecutar al inicio
    renderApp(); 
});